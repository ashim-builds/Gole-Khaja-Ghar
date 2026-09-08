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
    req.headers.authorization?.replace(/^Bearer\s+/i, '') ||
    req.cookies?.user_token ||
    req.cookies?.admin_token;

  if (!token) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }

  const user = await verifyUserToken(token);
  if (user) {
    req.user = user;
    return next();
  }

  const isAdmin = await verifyAdminToken(token);
  if (isAdmin) {
    req.isAdmin = true;
    req.user = {
      userId: 'admin',
      email: 'admin@golekhajaghar.com',
      role: 'ADMIN',
    };
    return next();
  }

  res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
}

export async function optionalUser(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const token =
    req.headers.authorization?.replace(/^Bearer\s+/i, '') ||
    req.cookies?.user_token ||
    req.cookies?.admin_token;

  if (token) {
    const user = await verifyUserToken(token);
    if (user) {
      req.user = { ...user, role: (user.role || '').toUpperCase() };
      return next();
    }

    const isAdmin = await verifyAdminToken(token);
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

  next();
}

export async function authenticateAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token =
    req.headers.authorization?.replace(/^Bearer\s+/i, '') ||
    req.cookies?.admin_token ||
    req.cookies?.user_token;

  if (!token) {
    res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
    return;
  }

  const isAdmin = await verifyAdminToken(token);
  if (isAdmin) {
    req.isAdmin = true;
    req.user = {
      userId: 'admin',
      email: 'admin@golekhajaghar.com',
      role: 'ADMIN',
    };
    return next();
  }

  const user = await verifyUserToken(token);
  if (user && ((user.role || '').toUpperCase() === 'ADMIN' || (user.role || '').toUpperCase() === 'SUPER_ADMIN')) {
    req.isAdmin = true;
    req.user = { ...user, role: 'ADMIN' };
    return next();
  }

  res.status(401).json({ error: 'Unauthorized: Invalid admin token' });
}

export function requireRoles(allowedRoles: string[]) {
  const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const token =
      req.headers.authorization?.replace(/^Bearer\s+/i, '') ||
      req.cookies?.user_token ||
      req.cookies?.admin_token;

    if (!token) {
      res.status(401).json({ error: 'Unauthorized: Authentication required' });
      return;
    }

    const user = await verifyUserToken(token);
    if (user) {
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
      return;
    }

    const isAdmin = await verifyAdminToken(token);
    if (isAdmin) {
      req.isAdmin = true;
      req.user = {
        userId: 'admin',
        email: 'admin@golekhajaghar.com',
        role: 'ADMIN',
      };
      return next();
    }

    res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  };
}
