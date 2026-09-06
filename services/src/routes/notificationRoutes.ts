import { Router } from 'express';
import {
  getUserNotifications,
  getUserUnreadCount,
  markUserRead,
  markUserReadAll,
  getAdminNotifications,
  getAdminUnreadCount,
  markAdminRead,
  markAdminReadAll,
} from '../controllers/notificationController.js';
import { authenticateUser, authenticateAdmin } from '../middleware/auth.js';

const router = Router();

// Customer notification endpoints
router.get('/', authenticateUser, getUserNotifications);
router.get('/unread-count', authenticateUser, getUserUnreadCount);
router.patch('/:id/read', authenticateUser, markUserRead);
router.post('/:id/read', authenticateUser, markUserRead);
router.post('/read-all', authenticateUser, markUserReadAll);
router.patch('/read-all', authenticateUser, markUserReadAll);

// Admin notification endpoints
router.get('/admin', authenticateAdmin, getAdminNotifications);
router.get('/admin/unread-count', authenticateAdmin, getAdminUnreadCount);
router.patch('/admin/:id/read', authenticateAdmin, markAdminRead);
router.post('/admin/:id/read', authenticateAdmin, markAdminRead);
router.post('/admin/read-all', authenticateAdmin, markAdminReadAll);
router.patch('/admin/read-all', authenticateAdmin, markAdminReadAll);

export default router;
