import { Router } from 'express';
import {
  checkout,
  getOrderStatus,
  getUserOrders,
  cancelOrder,
  getOrderForPayment,
  settleOnlinePayment,
} from '../controllers/orderController.js';
import { authenticateUser, optionalUser } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/checkout', rateLimiter(10, 5 * 60 * 1000), authenticateUser, checkout);
router.get('/user', authenticateUser, getUserOrders);
router.get('/payment/:identifier', getOrderForPayment);
router.post('/payment/:id/settle', settleOnlinePayment);
router.get('/:orderNumber/status', getOrderStatus);
router.post('/:orderNumber/cancel', authenticateUser, cancelOrder);

export default router;
