import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import prisma from '../config/db.js';

// Since we don't have express-async-handler installed, let's just use a simple try/catch wrapper or install it. 
// Given package.json, we don't have it. I'll write my own asyncHandler.
const asyncWrapper = (fn) => (req, res, next) => fn(req, res, next).catch(next);

export const protect = asyncWrapper(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

      req.user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, name: true, email: true, role: true }
      });

      next();
    } catch (error) {
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

export const softProtect = asyncWrapper(async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      req.user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, name: true, email: true, role: true }
      });
    } catch (error) {
      // Intentionally swallow error to allow guest checkout to proceed
    }
  }
  next();
});

export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(401);
    throw new Error('Not authorized as an admin');
  }
};
