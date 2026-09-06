import { Router } from 'express';
import { subscribePush, unsubscribePush, getVapidPublicKey } from '../controllers/pushController.js';
import { optionalUser } from '../middleware/auth.js';

const router = Router();

router.get('/vapid-public-key', getVapidPublicKey);
router.post('/subscribe', optionalUser, subscribePush);
router.post('/unsubscribe', unsubscribePush);

export default router;
