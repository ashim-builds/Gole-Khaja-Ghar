import { Router } from 'express';
import multer from 'multer';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStock,
} from '../controllers/productController.js';
import {
  getAdminOrders,
  getAdminOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  getAdminLiveUpdates,
} from '../controllers/orderController.js';
import { authenticateAdmin } from '../middleware/auth.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const router = Router();

// Protect all admin routes
router.use(authenticateAdmin);

// Admin Product Management
router.post(
  '/products',
  upload.fields([
    { name: 'imageFile', maxCount: 1 },
    { name: 'galleryFiles', maxCount: 10 },
  ]),
  createProduct
);

router.put(
  '/products/:id',
  upload.fields([
    { name: 'imageFile', maxCount: 1 },
    { name: 'galleryFiles', maxCount: 10 },
  ]),
  updateProduct
);

router.delete('/products/:id', deleteProduct);
router.patch('/products/:id/stock', toggleProductStock);

// Admin Order Management
router.get('/orders', getAdminOrders);
router.get('/orders/:id', getAdminOrderById);
router.patch('/orders/:id/status', updateOrderStatus);
router.patch('/orders/status', updateOrderStatus);
router.patch('/orders/:id/payment', updatePaymentStatus);
router.patch('/orders/payment', updatePaymentStatus);
router.get('/live-updates', getAdminLiveUpdates);

export default router;
