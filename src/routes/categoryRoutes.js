import express from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/').get(getCategories).post(protect, admin, createCategory);
router
  .route('/:id')
  .put(protect, admin, updateCategory)
  .delete(protect, admin, deleteCategory);

export default router;
