import { Request, Response, NextFunction } from 'express';
import { verifyAdminToken, verifyUserToken } from '../auth/jwt.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
  isAdmin?: boolean;
}

export async function authenticateUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token =
    req.cookies?.user_token ||
    req.headers.authorization?.replace(/^Bearer\s+/i, '');

  if (!token) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }

  const user = await verifyUserToken(token);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    return;
  }

  req.user = user;
  next();
}

export async function optionalUser(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const token =
    req.cookies?.user_token ||
    req.headers.authorization?.replace(/^Bearer\s+/i, '');

  if (token) {
    const user = await verifyUserToken(token);
    if (user) {
      req.user = user;
    }
  }
  next();
}

export async function authenticateAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token =
    req.cookies?.admin_token ||
    req.headers.authorization?.replace(/^Bearer\s+/i, '');

  if (!token) {
    res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
    return;
  }

  const isAdmin = await verifyAdminToken(token);
  if (!isAdmin) {
    res.status(401).json({ error: 'Unauthorized: Invalid admin token' });
    return;
  }

  req.isAdmin = true;
  next();
}
