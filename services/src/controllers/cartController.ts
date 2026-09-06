import { Response } from 'express';
import UserModel from '../models/User.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export async function getDbCart(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await UserModel.findById(req.user.userId).select('cart').lean();
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ success: true, items: user.cart || [] });
  } catch (error) {
    console.error('getDbCart error:', error);
    res.status(500).json({ error: 'Database error' });
  }
}

export async function syncDbCart(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { items } = req.body;
    if (!Array.isArray(items)) {
      res.status(400).json({ error: 'Invalid cart payload' });
      return;
    }

    const boundedItems = items.slice(0, 50);
    await UserModel.findByIdAndUpdate(req.user.userId, { cart: boundedItems });

    res.json({ success: true });
  } catch (error) {
    console.error('syncDbCart error:', error);
    res.status(500).json({ error: 'Database error' });
  }
}

export async function clearDbCart(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    await UserModel.findByIdAndUpdate(req.user.userId, { cart: [] });
    res.json({ success: true });
  } catch (error) {
    console.error('clearDbCart error:', error);
    res.status(500).json({ error: 'Database error' });
  }
}
