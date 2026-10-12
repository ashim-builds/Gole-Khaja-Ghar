import prisma, { DB_POOL_CONFIG } from '../lib/prisma.js';

export { DB_POOL_CONFIG };

export async function connectToDatabase(retries = 5, delay = 2000): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await prisma.$connect();
      console.log(`[Database] MySQL (Prisma) Connected successfully (Pool limit: ${DB_POOL_CONFIG.connectionLimit}, idleTimeout: ${DB_POOL_CONFIG.idleTimeout}ms)`);
      return;
    } catch (error) {
      console.error(`[Database] Connection attempt ${attempt}/${retries} failed:`, (error as Error).message || error);
      if (attempt < retries) {
        console.log(`[Database] Retrying connection in ${delay / 1000}s...`);
        await new Promise((res) => setTimeout(res, delay));
      } else {
        console.error('[Database] Could not connect to MySQL database after multiple attempts. Please verify DATABASE_URL in .env');
      }
    }
  }
}

/**
 * Safely tear down and disconnect connection pool to prevent zombie or orphaned
 * MySQL connection processes on CloudLinux/cPanel.
 */
export async function closePool(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log('[Database] MySQL connection pool closed cleanly.');
  } catch (error) {
    console.error('[Database] Error closing MySQL connection pool:', error);
  }
}

export default connectToDatabase;
