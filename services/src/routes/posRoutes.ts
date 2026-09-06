import { Router } from 'express';
import {
  createTableOrder,
  getTableSessionDetails,
  closeTableSession,
} from '../controllers/posController.js';
import { optionalUser } from '../middleware/auth.js';

const router = Router();

router.post('/orders', optionalUser, createTableOrder);
router.get('/sessions/:sessionId', getTableSessionDetails);
router.post('/sessions/:sessionId/close', closeTableSession);

export default router;
