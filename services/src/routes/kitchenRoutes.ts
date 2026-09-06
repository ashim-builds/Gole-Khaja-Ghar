import { Router } from 'express';
import {
  getActiveKotTickets,
  updateKotStatus,
  markKotDelivered,
  updateKotItemStatus,
} from '../controllers/kitchenController.js';

const router = Router();

router.get('/tickets', getActiveKotTickets);
router.patch('/tickets/:id/status', updateKotStatus);
router.patch('/tickets/:id/deliver', markKotDelivered);
router.patch('/items/:itemId/status', updateKotItemStatus);

export default router;
