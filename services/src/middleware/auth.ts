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
  const adminToken =
    req.cookies?.admin_token ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : undefined);

  if (adminToken) {
    const isAdmin = await verifyAdminToken(adminToken);
    if (isAdmin) {
      req.isAdmin = true;
      req.user = {
        userId: 'admin',
        email: 'admin@golekhajaghar.com',
        role: 'ADMIN',
      };
      return next();
    }
  }

  const token =
    req.cookies?.user_token ||
    req.headers.authorization?.replace(/^Bearer\s+/i, '');

  if (token) {
    const user = await verifyUserToken(token);
    if (user) {
      req.user = { ...user, role: (user.role || '').toUpperCase() };
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
  req.user = {
    userId: 'admin',
    email: 'admin@golekhajaghar.com',
    role: 'ADMIN',
  };
  next();
}

export function requireRoles(allowedRoles: string[]) {
  const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    // 1. Check admin token
    const adminToken =
      req.cookies?.admin_token ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.slice(7)
        : undefined);

    if (adminToken) {
      const isAdmin = await verifyAdminToken(adminToken);
      if (isAdmin) {
        req.isAdmin = true;
        req.user = {
          userId: 'admin',
          email: 'admin@golekhajaghar.com',
          role: 'ADMIN',
        };
        return next();
      }
    }

    // 2. Check user token
    const token =
      req.cookies?.user_token ||
      req.headers.authorization?.replace(/^Bearer\s+/i, '');

    if (!token) {
      res.status(401).json({ error: 'Unauthorized: Authentication required' });
      return;
    }

    const user = await verifyUserToken(token);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
      return;
    }

    const role = (user.role || '').toUpperCase();
    req.user = { ...user, role };

    if (
      role === 'ADMIN' ||
      role === 'SUPER_ADMIN' ||
      normalizedAllowed.includes(role)
    ) {
      return next();
    }

    res.status(403).json({
      error: `Forbidden: Access restricted to ${allowedRoles.join(', ')}`,
    });
  };
}
