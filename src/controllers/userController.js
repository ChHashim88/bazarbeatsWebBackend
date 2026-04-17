import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';
import generateToken from '../utils/generateToken.js';
import { validationResult } from 'express-validator';

const asyncWrapper = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
export const authUser = asyncWrapper(async (req, res) => {
  console.log("LOGIN HIT");
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;

  console.log("Before DB");
  const user = await prisma.user.findUnique({ where: { email } });
  console.log("After DB");

  if (user && (await bcrypt.compare(password, user.password))) {
    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user.id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
export const registerUser = asyncWrapper(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, email, password } = req.body;

  const userExists = await prisma.user.findUnique({ where: { email } });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  if (user) {
    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user.id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = asyncWrapper(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, email: true, role: true }
  });

  if (user) {
    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = asyncWrapper(async (req, res) => {
  const users = await prisma.user.findMany({
    where: { role: 'USER' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json(users);
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = asyncWrapper(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });

  if (user) {
    if (user.role === 'ADMIN' && req.user.id === user.id) {
      res.status(400);
      throw new Error('Cannot delete your own admin account');
    }
    await prisma.user.delete({ where: { id: user.id } });
    res.json({ message: 'User removed successfully' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user by Admin
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = asyncWrapper(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });

  if (user) {
    const dataToUpdate = {
      name: req.body.name || user.name,
      email: req.body.email || user.email,
      role: req.body.role || user.role,
    };

    if (req.body.password && req.body.password.length >= 6) {
      const salt = await bcrypt.genSalt(10);
      dataToUpdate.password = await bcrypt.hash(req.body.password, salt);
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    });

    res.json(updatedUser);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});
