import { Router } from 'express';
import {
  subscribePush,
  unsubscribePush,
  getVapidPublicKey,
  getPushSubscribersCount,
  getTemplatesHandler,
  getScheduleStatusHandler,
  updateScheduleStatusHandler,
  broadcastNotificationHandler,
} from '../controllers/pushController.js';
import { optionalUser, authenticateAdmin } from '../middleware/auth.js';

const router = Router();

// Public / User Push Subscription endpoints
router.get('/vapid-public-key', getVapidPublicKey);
router.post('/subscribe', optionalUser, subscribePush);
router.post('/unsubscribe', unsubscribePush);
router.get('/templates', getTemplatesHandler);

// Admin-only Push & Broadcast Management endpoints
router.get('/subscribers-count', authenticateAdmin, getPushSubscribersCount);
router.get('/schedule-status', authenticateAdmin, getScheduleStatusHandler);
router.patch('/schedule-status', authenticateAdmin, updateScheduleStatusHandler);
router.post('/broadcast', authenticateAdmin, broadcastNotificationHandler);

export default router;
