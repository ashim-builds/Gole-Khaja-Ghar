import { Router } from 'express';
import multer from 'multer';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStock,
  adjustProductStock,
} from '../controllers/productController.js';
import {
  getAdminOrders,
  getAdminOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  getAdminLiveUpdates,
} from '../controllers/orderController.js';
import { adminLogin, adminLogout } from '../controllers/authController.js';
import { authenticateAdmin, requireRoles } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimit.js';

import {
  listWaiters,
  createWaiter,
  deleteWaiter,
  testAdminPush,
} from '../controllers/waiterController.js';

import {
  getStoreStatusHandler,
  updateStoreStatusHandler,
} from '../controllers/storeConfigController.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const router = Router();

// Public Admin Auth Routes
router.post('/login', rateLimiter(5, 5 * 60 * 1000), adminLogin);
router.post('/logout', adminLogout);

// Allow staff/waiters & admins to list active waiters for POS table assignment
router.get('/waiters', requireRoles(['WAITER', 'CASHIER', 'KITCHEN', 'CHEF', 'ADMIN', 'STAFF']), listWaiters);

// Live updates for Admin Dashboard & Staff Terminals
router.get('/live-updates', requireRoles(['ADMIN', 'SUPER_ADMIN', 'WAITER', 'CASHIER', 'KITCHEN', 'CHEF', 'STAFF']), getAdminLiveUpdates);

// Protect all following admin routes
router.use(authenticateAdmin);

// Auth verification endpoint
router.get('/check-auth', (_req, res) => {
  res.json({ success: true, authenticated: true, isAdmin: true });
});

// Admin Store Open/Close Controls
router.get('/store-status', getStoreStatusHandler);
router.patch('/store-status', updateStoreStatusHandler);

// Admin Product Management
router.post(
  '/products',
  upload.fields([
    { name: 'imageFile', maxCount: 1 },
    { name: 'galleryFiles', maxCount: 10 },
  ]),
  createProduct
);

router.put(
  '/products/:id',
  upload.fields([
    { name: 'imageFile', maxCount: 1 },
    { name: 'galleryFiles', maxCount: 10 },
  ]),
  updateProduct
);

router.delete('/products/:id', deleteProduct);
router.patch('/products/:id/stock', toggleProductStock);
router.post('/products/:id/adjust-stock', adjustProductStock);
router.patch('/products/:id/adjust-stock', adjustProductStock);

// Admin Order Management
router.get('/orders', getAdminOrders);
router.get('/orders/:id', getAdminOrderById);
router.patch('/orders/:id/status', updateOrderStatus);
router.patch('/orders/status', updateOrderStatus);
router.patch('/orders/:id/payment', updatePaymentStatus);
router.patch('/orders/payment', updatePaymentStatus);
router.get('/live-updates', getAdminLiveUpdates);

// Admin Waiter Management
router.post('/waiters', createWaiter);
router.delete('/waiters/:id', deleteWaiter);

// Admin Notification Test
router.post('/test-push', testAdminPush);

export default router;
