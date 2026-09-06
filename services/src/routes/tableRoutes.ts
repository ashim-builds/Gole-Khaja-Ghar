import { Router } from 'express';
import {
  listTables,
  createTable,
  updateTable,
  deleteTable,
  openTableSession,
  getTableHistory,
} from '../controllers/tableController.js';
import { optionalUser, requireRoles } from '../middleware/auth.js';

const router = Router();

router.get('/', optionalUser, listTables);
router.get('/history', requireRoles(['WAITER', 'CASHIER']), getTableHistory);
router.post('/open-session', requireRoles(['WAITER', 'CASHIER']), openTableSession);

// Table configuration CRUD is restricted to Admins
router.post('/', requireRoles(['ADMIN']), createTable);
router.put('/:id', requireRoles(['ADMIN']), updateTable);
router.delete('/:id', requireRoles(['ADMIN']), deleteTable);

export default router;
