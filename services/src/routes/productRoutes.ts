import { Router } from 'express';
import {
  getProducts,
  getProductBySlug,
  getCategories,
  getFeaturedProducts,
} from '../controllers/productController.js';

const router = Router();

router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/categories', getCategories);
router.get('/:slug', getProductBySlug);

export default router;
