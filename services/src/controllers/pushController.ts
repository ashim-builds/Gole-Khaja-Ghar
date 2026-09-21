import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { notificationScheduler } from '../lib/notificationScheduler.js';
import { NOTIFICATION_TEMPLATES } from '../lib/notificationTemplates.js';

export async function subscribePush(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { subscription, type, userId: bodyUserId } = req.body;
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      res.status(400).json({ error: 'Invalid subscription payload' });
      return;
    }

    const isAdmin = type === 'admin';
    const clientType = isAdmin ? 'ADMIN' : 'CUSTOMER';
    const userId = !isAdmin ? (req.user?.userId || bodyUserId || null) : null;

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

/**
 * Get subscriber counts
 */
export async function getPushSubscribersCount(_req: Request, res: Response): Promise<void> {
  try {
    const [totalCustomers, totalAdmins] = await Promise.all([
      prisma.pushSubscription.count({ where: { clientType: 'CUSTOMER' } }),
      prisma.pushSubscription.count({ where: { clientType: 'ADMIN' } }),
    ]);

    res.json({
      success: true,
      customers: totalCustomers,
      admins: totalAdmins,
      total: totalCustomers + totalAdmins,
    });
  } catch (error) {
    console.error('getPushSubscribersCount error:', error);
    res.status(500).json({ error: 'Failed to fetch subscriber count' });
  }
}

/**
 * Get all available notification templates
 */
export async function getTemplatesHandler(_req: Request, res: Response): Promise<void> {
  res.json({
    success: true,
    templates: Object.values(NOTIFICATION_TEMPLATES),
  });
}

/**
 * Get scheduler status & daily schedule slots
 */
export async function getScheduleStatusHandler(_req: Request, res: Response): Promise<void> {
  try {
    const status = notificationScheduler.getStatus();
    res.json({
      success: true,
      ...status,
    });
  } catch (error) {
    console.error('getScheduleStatusHandler error:', error);
    res.status(500).json({ error: 'Failed to fetch schedule status' });
  }
}

/**
 * Update scheduler settings or individual slot
 */
export async function updateScheduleStatusHandler(req: Request, res: Response): Promise<void> {
  try {
    const { autoEnabled, slotId, updates } = req.body;

    if (typeof autoEnabled === 'boolean') {
      notificationScheduler.setEnabled(autoEnabled);
    }

    if (slotId && updates) {
      notificationScheduler.updateSlot(slotId, updates);
    }

    const currentStatus = notificationScheduler.getStatus();
    res.json({
      success: true,
      message: 'Notification schedule updated successfully',
      ...currentStatus,
    });
  } catch (error) {
    console.error('updateScheduleStatusHandler error:', error);
    res.status(500).json({ error: 'Failed to update schedule status' });
  }
}

/**
 * Broadcast notification on-demand (preset template or custom)
 */
export async function broadcastNotificationHandler(req: Request, res: Response): Promise<void> {
  try {
    const { templateId, title, body, url, icon, targetRole = 'CUSTOMER', saveToDb = true } = req.body;

    let finalTitle = title;
    let finalBody = body;
    let finalUrl = url;
    let finalIcon = icon;
    let category = 'CUSTOM_BROADCAST';

    // If templateId provided, use or override template defaults
    if (templateId && NOTIFICATION_TEMPLATES[templateId]) {
      const t = NOTIFICATION_TEMPLATES[templateId];
      finalTitle = finalTitle || t.title;
      finalBody = finalBody || t.body;
      finalUrl = finalUrl || t.url;
      finalIcon = finalIcon || t.icon;
      category = t.category;
    }

    if (!finalTitle || !finalBody) {
      res.status(400).json({ error: 'Notification title and body are required' });
      return;
    }

    const result = await notificationScheduler.broadcast({
      title: finalTitle,
      body: finalBody,
      url: finalUrl || '/shop',
      icon: finalIcon || '/favicon-circle.png',
      templateId,
      category,
      targetRole: targetRole === 'ADMIN' ? 'ADMIN' : 'CUSTOMER',
      saveToDb,
    });

    res.json({
      success: true,
      message: `Notification successfully broadcasted to ${result.recipientsCount} recipient(s)!`,
      result,
    });
  } catch (error) {
    console.error('broadcastNotificationHandler error:', error);
    res.status(500).json({ error: 'Failed to broadcast notification' });
  }
}
