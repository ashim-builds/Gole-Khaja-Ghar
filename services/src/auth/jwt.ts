import { jwtVerify, SignJWT } from 'jose';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set.');
}

const key = new TextEncoder().encode(JWT_SECRET);

export interface AuthPayload {
  role: 'customer' | 'admin' | 'waiter' | 'kitchen';
  userId?: string;
  email?: string;
}

export async function signAdminToken(): Promise<string> {
  return await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key);
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, key);
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

export async function signUserToken(userId: string, email: string, role: string = 'customer'): Promise<string> {
  return await new SignJWT({ role, userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(key);
}

export async function verifyUserToken(token: string): Promise<{ userId: string; email: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, key);
    if (payload.userId) {
      return {
        userId: payload.userId as string,
        email: (payload.email as string) || '',
        role: (payload.role as string) || 'customer',
      };
    }
    return null;
  } catch {
    return null;
  }
}
