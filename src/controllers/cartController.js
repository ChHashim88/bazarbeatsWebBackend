import prisma from '../config/db.js';
import asyncHandler from 'express-async-handler';

// Get Cart for a User
export const getCart = asyncHandler(async (req, res) => {
  let cart = await prisma.cart.findUnique({
    where: { userId: req.user.id },
    include: { items: { include: { product: true } } }
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId: req.user.id },
      include: { items: true }
    });
  }
  res.json(cart);
});

// Add Item to Cart
export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity, price, size, color } = req.body;
  
  let cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
  
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId: req.user.id } });
  }

  // Check if item already exists in cart with same size and color
  const existingItem = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId, size, color }
  });

  if (existingItem) {
    const updatedItem = await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + quantity }
    });
    res.json(updatedItem);
  } else {
    const newItem = await prisma.cartItem.create({
      data: { cartId: cart.id, productId, quantity, price, size, color }
    });
    res.status(201).json(newItem);
  }
});

// Update Cart Item
export const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const itemId = req.params.id;

  const item = await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity }
  });

  res.json(item);
});

// Remove Cart Item
export const removeCartItem = asyncHandler(async (req, res) => {
  const itemId = req.params.id;

  await prisma.cartItem.delete({ where: { id: itemId } });
  
  res.json({ message: 'Item removed from cart' });
});
