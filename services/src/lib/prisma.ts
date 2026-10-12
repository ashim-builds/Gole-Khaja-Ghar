import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

/**
 * CloudLinux LVE & cPanel Resource Protection:
 * Restrict pool size and idle connection lifetime to prevent MySQL thread
 * and NPROC exhaustion across multi-tenant hosting environments.
 */
export const DB_POOL_CONFIG = {
  connectionLimit: 3,
  maxIdle: 2,
  idleTimeout: 30000, // 30 seconds
  queueLimit: 20,
};

let dbUrl = process.env.DATABASE_URL || '';
if (dbUrl) {
  try {
    const urlObj = new URL(dbUrl);
    // Cap connection_limit to max 3
    const existingLimit = parseInt(urlObj.searchParams.get('connection_limit') || '', 10);
    if (!existingLimit || existingLimit > DB_POOL_CONFIG.connectionLimit) {
      urlObj.searchParams.set('connection_limit', String(DB_POOL_CONFIG.connectionLimit));
    }
    if (!urlObj.searchParams.has('pool_timeout')) {
      urlObj.searchParams.set('pool_timeout', '10');
    }
    if (!urlObj.searchParams.has('idle_timeout')) {
      urlObj.searchParams.set('idle_timeout', '30');
    }
    if (!urlObj.searchParams.has('connect_timeout')) {
      urlObj.searchParams.set('connect_timeout', '10');
    }
    dbUrl = urlObj.toString();
    process.env.DATABASE_URL = dbUrl;
  } catch {
    // Fallback string replacement if URL constructor fails
    if (!dbUrl.includes('connection_limit')) {
      const separator = dbUrl.includes('?') ? '&' : '?';
      dbUrl = `${dbUrl}${separator}connection_limit=${DB_POOL_CONFIG.connectionLimit}&pool_timeout=10&idle_timeout=30`;
      process.env.DATABASE_URL = dbUrl;
    } else {
      dbUrl = dbUrl.replace(/connection_limit=\d+/, `connection_limit=${DB_POOL_CONFIG.connectionLimit}`);
      process.env.DATABASE_URL = dbUrl;
    }
  }
}

export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl || undefined,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

// Preserve singleton across hot-reloads and module re-evaluations
globalThis.prismaGlobal = prisma;

export default prisma;
