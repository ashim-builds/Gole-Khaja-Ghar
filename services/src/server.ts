import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import connectToDatabase from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import pushRoutes from './routes/pushRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import tableRoutes from './routes/tableRoutes.js';
import posRoutes from './routes/posRoutes.js';
import kitchenRoutes from './routes/kitchenRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

import compression from 'compression';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const rawOrigins = [
  process.env.CLIENT_URL,
  process.env.CORS_ORIGIN,
  'http://localhost:3000',
  'http://localhost:5173',
]
  .filter(Boolean)
  .flatMap((url) => (url as string).split(','))
  .map((url) => url.trim().replace(/\/+$/, ''));

const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return true;
  const cleanOrigin = origin.replace(/\/+$/, '');
  return (
    rawOrigins.includes(cleanOrigin) ||
    cleanOrigin.endsWith('.onrender.com') ||
    cleanOrigin.endsWith('.vercel.app') ||
    cleanOrigin.includes('localhost') ||
    cleanOrigin.includes('127.0.0.1') ||
    /^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(cleanOrigin)
  );
};

// Global Middlewares
app.use(compression() as any);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      const cleanOrigin = origin.replace(/\/+$/, '');
      if (isOriginAllowed(cleanOrigin)) {
        callback(null, origin);
      } else {
        // Fallback: reflect the origin string so credentials: true remains valid
        callback(null, origin);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Set-Cookie'],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

import path from 'path';
import fs from 'fs';

const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
const serveStaticUploads = (_req: any, res: any, next: any) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
};
app.use('/uploads', serveStaticUploads, express.static(uploadsDir, { maxAge: '7d', etag: true }));
app.use('/api/uploads', serveStaticUploads, express.static(uploadsDir, { maxAge: '7d', etag: true }));

import prisma from './lib/prisma.js';

import { getStoreStatusHandler } from './controllers/storeConfigController.js';

// Root Status
app.get('/', (_req, res) => {
  res.json({ success: true, message: 'Gole Khaja Ghar API Backend Services Running', health: '/health', api: '/api' });
});

// Health Check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'golu-khaja-ghar-services', timestamp: new Date().toISOString() });
});

// Public Store Operational Status (for customer site & live check)
app.get('/api/store-status', getStoreStatusHandler);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/kitchen', kitchenRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/reports', reportRoutes);

import http from 'http';
import { initSocket } from './lib/socket.js';

// Centralized Error Handler
app.use(errorHandler);

const httpServer = http.createServer(app);
const primaryClientUrl = rawOrigins[0] || 'http://localhost:3000';
initSocket(httpServer, primaryClientUrl);

// Optimize Keep-Alive and Request Timeouts
httpServer.keepAliveTimeout = 65000;
httpServer.headersTimeout = 66000;
httpServer.requestTimeout = 30000;

// Graceful process shutdown handling
const gracefulShutdown = (signal: string) => {
  console.log("[Server] Received " + signal + ". Gracefully stopping HTTP & sockets...");
  httpServer.close(async () => {
    try {
      await prisma["$disconnect"]();
      console.log("[Database] Prisma disconnected cleanly.");
    } catch (e) {}
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Start Server
async function startServer() {
  try {
    await connectToDatabase();
    httpServer.listen(PORT, () => {
      console.log(`Backend Service & WebSockets] Running on http://localhost:${PORT}`);
      console.log(`[CORS] Configured for frontend origins: ${rawOrigins.join(', ')}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
