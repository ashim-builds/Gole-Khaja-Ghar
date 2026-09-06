import { Router } from 'express';
import { subscribePush } from '../controllers/pushController.js';
import { optionalUser } from '../middleware/auth.js';

const router = Router();

router.post('/subscribe', optionalUser, subscribePush);

export default router;
