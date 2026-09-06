import { Request, Response } from 'express';
import mongoose from 'mongoose';
import NotificationModel from '../models/Notification.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export async function getUserNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const notifications = await NotificationModel.find({
      recipientType: 'USER',
      recipientId: req.user.userId,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ success: true, notifications });
  } catch (error) {
    console.error('getUserNotifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
}

export async function getUserUnreadCount(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const unreadCount = await NotificationModel.countDocuments({
      recipientType: 'USER',
      recipientId: req.user.userId,
      read: false,
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
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid notification ID' });
      return;
    }

    await NotificationModel.findOneAndUpdate(
      { _id: id, recipientId: req.user.userId, recipientType: 'USER' },
      { read: true }
    );

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

    await NotificationModel.updateMany(
      { recipientId: req.user.userId, recipientType: 'USER', read: false },
      { read: true }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('markUserReadAll error:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
}

export async function getAdminNotifications(_req: Request, res: Response): Promise<void> {
  try {
    const notifications = await NotificationModel.find({ recipientType: 'ADMIN' })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ success: true, notifications });
  } catch (error) {
    console.error('getAdminNotifications error:', error);
    res.status(500).json({ error: 'Failed to fetch admin notifications' });
  }
}

export async function getAdminUnreadCount(_req: Request, res: Response): Promise<void> {
  try {
    const unreadCount = await NotificationModel.countDocuments({
      recipientType: 'ADMIN',
      read: false,
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
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid notification ID' });
      return;
    }

    await NotificationModel.findOneAndUpdate(
      { _id: id, recipientType: 'ADMIN' },
      { read: true }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('markAdminRead error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
}

export async function markAdminReadAll(_req: Request, res: Response): Promise<void> {
  try {
    await NotificationModel.updateMany(
      { recipientType: 'ADMIN', read: false },
      { read: true }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('markAdminReadAll error:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
}
