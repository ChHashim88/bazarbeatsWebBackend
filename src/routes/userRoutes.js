import express from 'express';
import { authUser, registerUser, getUserProfile, getUsers, deleteUser, updateUser } from '../controllers/userController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';
import { body } from 'express-validator';

const router = express.Router();

router.route('/')
  .get(protect, admin, getUsers)
  .post(
    [
      body('name', 'Name is required').not().isEmpty(),
      body('email', 'Please include a valid email').isEmail(),
      body('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    ],
    registerUser
  );

router.post(
  '/login',
  [
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password is required').exists(),
  ],
  authUser
);

router.get('/profile', protect, getUserProfile);

router.route('/:id')
  .put(protect, admin, updateUser)
  .delete(protect, admin, deleteUser);

export default router;
