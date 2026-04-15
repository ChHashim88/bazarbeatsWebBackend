import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
} from '../controllers/cartController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, getCart);
router.route('/add').post(protect, addToCart);
router.route('/update/:id').put(protect, updateCartItem);
router.route('/:id').delete(protect, removeCartItem);

export default router;
