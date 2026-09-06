import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

function mapNotification(doc: any) {
  return {
    id: doc.id,
    _id: doc.id,
    userId: doc.userId,
    targetRole: doc.targetRole,
    title: doc.title,
    message: doc.body,
    body: doc.body,
    linkUrl: doc.linkUrl,
    read: doc.isRead,
    isRead: doc.isRead,
    createdAt: doc.createdAt,
  };
}

export async function getUserNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.json({ success: true, notifications: [] });
      return;
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({ success: true, notifications: notifications.map(mapNotification) });
  } catch (error) {
    console.error('getUserNotifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
}

export async function getUserUnreadCount(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.json({ success: true, unreadCount: 0 });
      return;
    }

    const unreadCount = await prisma.notification.count({
      where: {
        userId: req.user.userId,
        isRead: false,
      },
    });

    res.json({ success: true, unreadCount });
  } catch (error) {
    console.error('getUserUnreadCount error:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
}

export async function markUserRead(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    await prisma.notification.updateMany({
      where: { id, userId: req.user.userId },
      data: { isRead: true },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('markUserRead error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
}

export async function markUserReadAll(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    await prisma.notification.updateMany({
      where: { userId: req.user.userId, isRead: false },
      data: { isRead: true },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('markUserReadAll error:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
}

export async function getAdminNotifications(_req: Request, res: Response): Promise<void> {
  try {
    const notifications = await prisma.notification.findMany({
      where: { targetRole: 'ADMIN' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({ success: true, notifications: notifications.map(mapNotification) });
  } catch (error) {
    console.error('getAdminNotifications error:', error);
    res.status(500).json({ error: 'Failed to fetch admin notifications' });
  }
}

export async function getAdminUnreadCount(_req: Request, res: Response): Promise<void> {
  try {
    const unreadCount = await prisma.notification.count({
      where: {
        targetRole: 'ADMIN',
        isRead: false,
      },
    });

    res.json({ success: true, unreadCount });
  } catch (error) {
    console.error('getAdminUnreadCount error:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
}

export async function markAdminRead(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.notification.updateMany({
      where: { id, targetRole: 'ADMIN' },
      data: { isRead: true },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('markAdminRead error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
}

export async function markAdminReadAll(_req: Request, res: Response): Promise<void> {
  try {
    await prisma.notification.updateMany({
      where: { targetRole: 'ADMIN', isRead: false },
      data: { isRead: true },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('markAdminReadAll error:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
}
