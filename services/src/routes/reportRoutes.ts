import { Router } from 'express';
import { getDailySalesSummary, getSalesAnalytics } from '../controllers/reportController.js';

const router = Router();

router.get('/summary', getDailySalesSummary);
router.get('/analytics', getSalesAnalytics);

export default router;
