import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

// Clamp connection pool size to prevent thread exhaustion on CloudLinux / cPanel
let dbUrl = process.env.DATABASE_URL || '';
if (dbUrl && !dbUrl.includes('connection_limit')) {
  const separator = dbUrl.includes('?') ? '&' : '?';
  dbUrl = `${dbUrl}${separator}connection_limit=3&pool_timeout=10`;
  process.env.DATABASE_URL = dbUrl;
}

export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl || undefined,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// Preserve singleton across hot-reloads and module re-evaluations
globalThis.prismaGlobal = prisma;

export default prisma;
