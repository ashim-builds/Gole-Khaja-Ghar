import { Router } from 'express';
import {
  generateBill,
  recordPayment,
  getBillDetails,
  listBills,
} from '../controllers/billingController.js';
import { requireRoles } from '../middleware/auth.js';

const router = Router();

// Billing & Settlement operations are accessible to Waiters, Cashiers, and Admins
router.use(requireRoles(['WAITER', 'CASHIER']));

router.get('/', listBills);
router.post('/generate', generateBill);
router.post('/pay', recordPayment);
router.get('/:id', getBillDetails);

export default router;
