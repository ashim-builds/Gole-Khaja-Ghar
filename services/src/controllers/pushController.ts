import { Request, Response } from 'express';
import PushSubscriptionModel from '../models/PushSubscription.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export async function subscribePush(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { subscription, type } = req.body;
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      res.status(400).json({ error: 'Invalid subscription payload' });
      return;
    }

    const subType = type === 'admin' ? 'admin' : 'customer';

    if (subType === 'admin') {
      if (!req.isAdmin) {
        res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
        return;
      }
      await PushSubscriptionModel.findOneAndUpdate(
        { endpoint: subscription.endpoint },
        {
          endpoint: subscription.endpoint,
          keys: subscription.keys,
          type: 'admin',
          userId: undefined,
        },
        { upsert: true, new: true }
      );
    } else {
      await PushSubscriptionModel.findOneAndUpdate(
        { endpoint: subscription.endpoint },
        {
          endpoint: subscription.endpoint,
          keys: subscription.keys,
          type: 'customer',
          userId: req.user?.userId || undefined,
        },
        { upsert: true, new: true }
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('subscribePush error:', error);
    res.status(500).json({ error: 'Failed to save push subscription' });
  }
}
