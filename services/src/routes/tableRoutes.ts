import { Router } from 'express';
import {
  listTables,
  createTable,
  updateTable,
  deleteTable,
  openTableSession,
  getTableHistory,
} from '../controllers/tableController.js';
import { optionalUser } from '../middleware/auth.js';

const router = Router();

router.get('/', listTables);
router.get('/history', getTableHistory);
router.post('/', createTable);
router.put('/:id', updateTable);
router.delete('/:id', deleteTable);
router.post('/open-session', optionalUser, openTableSession);

export default router;
