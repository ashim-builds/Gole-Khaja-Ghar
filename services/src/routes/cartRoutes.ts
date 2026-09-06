import { Router } from 'express';
import { getDbCart, syncDbCart, clearDbCart } from '../controllers/cartController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateUser, getDbCart);
router.post('/sync', authenticateUser, syncDbCart);
router.delete('/', authenticateUser, clearDbCart);

export default router;
