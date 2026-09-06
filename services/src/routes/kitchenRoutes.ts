import { Router } from 'express';
import {
  getActiveKotTickets,
  updateKotStatus,
  markKotDelivered,
  updateKotItemStatus,
} from '../controllers/kitchenController.js';
import { requireRoles } from '../middleware/auth.js';

const router = Router();

// Kitchen Display System is restricted to CHEF / KITCHEN staff & Admin
router.use(requireRoles(['KITCHEN', 'CHEF']));

router.get('/tickets', getActiveKotTickets);
router.patch('/tickets/:id/status', updateKotStatus);
router.patch('/tickets/:id/deliver', markKotDelivered);
router.patch('/items/:itemId/status', updateKotItemStatus);

export default router;
