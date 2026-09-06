import { Router } from 'express';
import {
  generateBill,
  recordPayment,
  getBillDetails,
  listBills,
} from '../controllers/billingController.js';
import { optionalUser } from '../middleware/auth.js';

const router = Router();

router.get('/', listBills);
router.post('/generate', optionalUser, generateBill);
router.post('/pay', optionalUser, recordPayment);
router.get('/:id', getBillDetails);

export default router;
