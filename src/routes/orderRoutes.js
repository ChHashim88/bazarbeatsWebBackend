import express from 'express';
import {
  addOrderItems,
  getOrderById,
  updateOrderStatus,
  getMyOrders,
  getOrders,
  createPaymentIntent,
  getStats,
  deleteOrder,
  updateOrderPayment,
  registerPhysicalSale,
  getUserOrdersByAdmin,
} from '../controllers/orderController.js';
import { protect, admin, softProtect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/payment-intent').post(createPaymentIntent);
router.route('/physical').post(protect, admin, registerPhysicalSale);
router.route('/stats').get(protect, admin, getStats);
router.route('/').post(softProtect, addOrderItems).get(protect, admin, getOrders);
router.route('/myorders').get(protect, getMyOrders);
router.route('/user/:id').get(protect, admin, getUserOrdersByAdmin);
router.route('/:id').get(protect, getOrderById).delete(protect, admin, deleteOrder);
router.route('/:id/status').put(protect, admin, updateOrderStatus);
router.route('/:id/payment').put(protect, admin, updateOrderPayment);

export default router;
