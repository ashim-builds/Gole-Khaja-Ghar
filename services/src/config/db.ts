import prisma from '../lib/prisma.js';

export async function connectToDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ [Database] MySQL (Prisma) Connected successfully');
  } catch (error) {
    console.error('❌ [Database] MySQL connection error:', error);
    process.exit(1);
  }
}

export default connectToDatabase;
