import prisma from '../lib/prisma.js';

export async function connectToDatabase(retries = 5, delay = 2000): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await prisma.$connect();
      console.log('[Database] MySQL (Prisma) Connected successfully');
      return;
    } catch (error) {
      console.error(`[Database] Connection attempt ${attempt}/${retries} failed:`, (error as Error).message || error);
      if (attempt < retries) {
        console.log(`[Database] Retrying connection in ${delay / 1000}s...`);
        await new Promise((res) => setTimeout(res, delay));
      } else {
        console.error('[Database] Could not connect to MySQL database after multiple attempts.');
        process.exit(1);
      }
    }
  }
}

export default connectToDatabase;

