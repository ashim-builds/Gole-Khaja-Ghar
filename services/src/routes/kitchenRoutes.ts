import { Router } from 'express';
import {
  getActiveKotTickets,
  updateKotStatus,
  markKotDelivered,
  updateKotItemStatus,
} from '../controllers/kitchenController.js';
import { requireRoles } from '../middleware/auth.js';

const router = Router();

// Kitchen Display System & POS KOT updates - accessible to Kitchen staff, Waiters, and Admins
router.use(requireRoles(['KITCHEN', 'CHEF', 'WAITER', 'CASHIER', 'STAFF', 'ADMIN', 'SUPER_ADMIN']));

router.get('/tickets', getActiveKotTickets);
router.patch('/tickets/:id/status', updateKotStatus);
router.patch('/tickets/:id/deliver', markKotDelivered);
router.patch('/items/:itemId/status', updateKotItemStatus);

export default router;
