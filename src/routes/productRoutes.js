import express from 'express';
import {
  getProducts,
  getProductById,
  deleteProduct,
  createProduct,
  updateProduct,
  updateTrendingProducts,
} from '../controllers/productController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.put('/trending', protect, admin, updateTrendingProducts);

router.route('/').get(getProducts).post(protect, admin, createProduct);
router
  .route('/:id')
  .get(getProductById)
  .put(protect, admin, updateProduct)
  .delete(protect, admin, deleteProduct);

export default router;
