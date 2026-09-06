import { Router } from 'express';
import {
  register,
  login,
  getMe,
  logout,
  adminLogin,
  adminLogout,
  googleOAuthInitiate,
  googleOAuthCallback,
} from '../controllers/authController.js';
import { optionalUser } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/register', rateLimiter(5, 60 * 1000), register);
router.post('/login', rateLimiter(10, 60 * 1000), login);
router.get('/me', optionalUser, getMe);
router.post('/logout', logout);
router.get('/google', googleOAuthInitiate);
router.get('/google/callback', googleOAuthCallback);

router.post('/admin/login', rateLimiter(5, 5 * 60 * 1000), adminLogin);
router.post('/admin/logout', adminLogout);

export default router;
