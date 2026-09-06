import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export async function subscribePush(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { subscription, type } = req.body;
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      res.status(400).json({ error: 'Invalid subscription payload' });
      return;
    }

    const isAdmin = type === 'admin';
    const clientType = isAdmin ? 'ADMIN' : 'CUSTOMER';
    const userId = !isAdmin && req.user?.userId ? req.user.userId : null;

    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        p256dhKey: subscription.keys.p256dh,
        authKey: subscription.keys.auth,
        clientType,
        userId,
      },
      create: {
        endpoint: subscription.endpoint,
        p256dhKey: subscription.keys.p256dh,
        authKey: subscription.keys.auth,
        clientType,
        userId,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('subscribePush error:', error);
    res.status(500).json({ error: 'Failed to save push subscription' });
  }
}

export async function getVapidPublicKey(_req: Request, res: Response): Promise<void> {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || '' });
}

export async function unsubscribePush(req: Request, res: Response): Promise<void> {
  try {
    const { endpoint } = req.body;
    if (endpoint) {
      await prisma.pushSubscription.deleteMany({ where: { endpoint } });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('unsubscribePush error:', error);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
}
