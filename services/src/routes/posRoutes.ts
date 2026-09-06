import { Router } from 'express';
import {
  createTableOrder,
  getTableSessionDetails,
  closeTableSession,
} from '../controllers/posController.js';
import { requireRoles } from '../middleware/auth.js';

const router = Router();

// POS operations are accessible to Waiters, Cashiers, and Admins
router.use(requireRoles(['WAITER', 'CASHIER']));

router.post('/orders', createTableOrder);
router.get('/sessions/:sessionId', getTableSessionDetails);
router.post('/sessions/:sessionId/close', closeTableSession);

export default router;
