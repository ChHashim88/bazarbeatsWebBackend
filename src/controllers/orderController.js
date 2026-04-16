import prisma from '../config/db.js';
import asyncHandler from 'express-async-handler';
import { z } from 'zod';
import { sendOrderConfirmationEmail } from '../services/emailService.js';
const orderSchema = z.object({
  orderItems: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1),
    price: z.number(),
    size: z.string().optional(),
    color: z.string().optional()
  })).min(1),
  shippingAddress: z.object({
    fullName: z.string(),
    email: z.string().email(),
    phone: z.string(),
    address: z.string(),
    city: z.string(),
    postalCode: z.string(),
    country: z.string()
  }),
  totalPrice: z.number()
});


// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const addOrderItems = asyncHandler(async (req, res) => {
  // Validate input using Zod
  const validation = orderSchema.safeParse(req.body);
  
  if (!validation.success) {
    res.status(400);
    throw new Error('Invalid order data: ' + validation.error.errors.map(e => e.message).join(', '));
  }

  const { orderItems, shippingAddress, totalPrice, paymentMethod } = validation.data;

  // Pre-flight database stock validation block
  for (const item of orderItems) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    let sizeStock = product?.sizeStock || {};
    if (typeof sizeStock === 'string') sizeStock = JSON.parse(sizeStock);

    if (!item.size || !sizeStock[item.size] || sizeStock[item.size] < item.quantity) {
      res.status(400);
      throw new Error(`Insufficient stock for ${product?.name || 'an item'} size ${item.size || 'Unknown'}.`);
    }
  }

  const order = await prisma.order.create({
    data: {
      userId: req.user ? req.user.id : null,
      total: totalPrice,
      paymentMethod: paymentMethod || 'COD',
      shippingAddress,
      orderItems: {
        create: orderItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          size: item.size || null,
          color: item.color || null,
        }))
      }
    },
    include: { orderItems: { include: { product: true } } }
  });

  // Automatically deplete physical store inventory and log lifetime sales
  for (const item of orderItems) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    let sizeStock = product.sizeStock || {};
    if (typeof sizeStock === 'string') sizeStock = JSON.parse(sizeStock);

    if (item.size && sizeStock[item.size] !== undefined) {
      sizeStock[item.size] = Math.max(0, sizeStock[item.size] - item.quantity);
    }

    await prisma.product.update({
      where: { id: item.productId },
      data: { 
        stock: { decrement: item.quantity },
        sizeStock,
        sold: { increment: item.quantity }
      }
    });
  }

  // Send Order Confirmation Email
  const destinationEmail = req.user?.email || shippingAddress.email; 
  if (destinationEmail) {
    await sendOrderConfirmationEmail(destinationEmail, shippingAddress.fullName, order).catch(() => console.error('Email failed to send.'));
  }

  res.status(201).json(order);
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      orderItems: { include: { product: true } }
    }
  });

  if (order) {
    res.json(order);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const order = await prisma.order.findUnique({ 
    where: { id: req.params.id },
    include: { orderItems: true } 
  });

  if (order) {
    // If Admin cancels an order, physical stock must return to the warehouse and sales must reverse.
    if (order.status !== 'CANCELLED' && status === 'CANCELLED') {
      for (const item of order.orderItems) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        if (product) {
          let sizeStock = product.sizeStock || {};
          if (typeof sizeStock === 'string') sizeStock = JSON.parse(sizeStock);
          if (item.size && sizeStock[item.size] !== undefined) {
             sizeStock[item.size] += item.quantity;
          }
          await prisma.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity }, sizeStock, sold: { decrement: item.quantity } }
          });
        }
      }
    } 
    // If Admin un-cancels an order, we dynamically re-deduct the stock
    else if (order.status === 'CANCELLED' && status !== 'CANCELLED') {
      for (const item of order.orderItems) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        if (product) {
          let sizeStock = product.sizeStock || {};
          if (typeof sizeStock === 'string') sizeStock = JSON.parse(sizeStock);
          if (item.size && sizeStock[item.size] !== undefined) {
             sizeStock[item.size] = Math.max(0, sizeStock[item.size] - item.quantity);
          }
          await prisma.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity }, sizeStock, sold: { increment: item.quantity } }
          });
        }
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id: req.params.id },
      data: { status }
    });

    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Update order payment status
// @route   PUT /api/orders/:id/payment
// @access  Private/Admin
export const updateOrderPayment = asyncHandler(async (req, res) => {
  const { isPaid } = req.body;

  const order = await prisma.order.findUnique({ where: { id: req.params.id } });

  if (order) {
    const updatedOrder = await prisma.order.update({
      where: { id: req.params.id },
      data: { isPaid }
    });

    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user.id },
    include: { orderItems: true }
  });
  res.json(orders);
});

// @desc    Get user orders by Admin
// @route   GET /api/orders/user/:id
// @access  Private/Admin
export const getUserOrdersByAdmin = asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.params.id },
    include: { orderItems: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(orders);
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({
    include: { 
      user: { select: { id: true, name: true, email: true } }, 
      orderItems: { include: { product: true } } 
    }
  });
  res.json(orders);
});

// @desc    Delete order and restore physical stock
// @route   DELETE /api/orders/:id
// @access  Private/Admin
export const deleteOrder = asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { orderItems: true }
  });

  if (order) {
    // Atomically restore physical stock to the warehouse shelf and scrub sales metrics
    for (const item of order.orderItems) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (product) {
         let sizeStock = product.sizeStock || {};
         if (typeof sizeStock === 'string') sizeStock = JSON.parse(sizeStock);
         if (item.size && sizeStock[item.size] !== undefined) {
            sizeStock[item.size] += item.quantity;
         }
         await prisma.product.update({
           where: { id: item.productId },
           data: { stock: { increment: item.quantity }, sizeStock, sold: { decrement: item.quantity } }
         });
      }
    }

    // Destroy associated OrderItems to prevent DB constraint blocks
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
    
    // Destroy the root Order
    await prisma.order.delete({ where: { id: req.params.id } });
    
    res.json({ message: 'Order instantly cancelled and stock restored.' });
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Get dashboard stats
// @route   GET /api/orders/stats
// @access  Private/Admin
export const getStats = asyncHandler(async (req, res) => {
  const [
    totalOrders,
    totalProducts,
    totalUsers,
    paidOrders,
    unpaidOrders,
    pendingOrders,
    confirmedOrders,
    processingOrders,
    shippedOrders,
    deliveredOrders,
    cancelledOrders,
    paidSales,
    estimatedSales
  ] = await Promise.all([
    prisma.order.count(),
    prisma.product.count(),
    prisma.user.count({ where: { role: 'USER' } }),
    prisma.order.count({ where: { isPaid: true } }),
    prisma.order.count({ where: { isPaid: false } }),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.order.count({ where: { status: 'CONFIRMED' } }),
    prisma.order.count({ where: { status: 'PROCESSING' } }),
    prisma.order.count({ where: { status: 'SHIPPED' } }),
    prisma.order.count({ where: { status: 'DELIVERED' } }),
    prisma.order.count({ where: { status: 'CANCELLED' } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { isPaid: true } }),
    prisma.order.aggregate({ _sum: { total: true } })
  ]);

  // Aggregate past 6 months of historical real vs estimated revenue
  const allOrders = await prisma.order.findMany({
    select: { createdAt: true, total: true, isPaid: true, status: true }
  });

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const revenueDataMap = {};

  for (let i = 5; i >= 0; i--) {
     const d = new Date();
     d.setMonth(d.getMonth() - i);
     const monthStr = monthNames[d.getMonth()];
     revenueDataMap[monthStr] = { name: monthStr, revenue: 0, estimatedRevenue: 0 };
  }

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0,0,0,0);

  allOrders.forEach(order => {
     if (order.createdAt >= sixMonthsAgo) {
        const monthStr = monthNames[order.createdAt.getMonth()];
        if (revenueDataMap[monthStr]) {
            revenueDataMap[monthStr].estimatedRevenue += order.total;
            if (order.isPaid) {
                revenueDataMap[monthStr].revenue += order.total;
            }
        }
     }
  });

  const revenueData = Object.values(revenueDataMap);

  // Aggregate past 7 days of order volume
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const salesDataMap = {};

  for (let i = 6; i >= 0; i--) {
     const d = new Date();
     d.setDate(d.getDate() - i);
     const dayStr = daysOfWeek[d.getDay()];
     const key = `${d.getMonth()}-${d.getDate()}`;
     salesDataMap[key] = { name: dayStr, totalOrders: 0, delivered: 0, sortKey: d.getTime() };
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0,0,0,0);

  allOrders.forEach(order => {
     if (order.createdAt >= sevenDaysAgo) {
        const d = order.createdAt;
        const key = `${d.getMonth()}-${d.getDate()}`;
        if (salesDataMap[key]) {
            salesDataMap[key].totalOrders += 1;
            if (order.status === 'DELIVERED') {
                salesDataMap[key].delivered += 1;
            }
        }
     }
  });

  const salesData = Object.values(salesDataMap).sort((a, b) => a.sortKey - b.sortKey).map(d => ({ name: d.name, totalOrders: d.totalOrders, delivered: d.delivered }));

  const brandAggregations = await prisma.product.groupBy({
    by: ['brand'],
    _sum: {
      sold: true,
      stock: true
    },
    orderBy: {
      _sum: {
        sold: 'desc'
      }
    },
    take: 5
  });

  const topBrands = brandAggregations
    .filter(b => b.brand)
    .map(b => ({
      name: b.brand,
      sold: b._sum.sold || 0,
      stock: b._sum.stock || 0
    }));

  res.json({
    revenue: paidSales._sum.total || 0,
    estimatedRevenue: estimatedSales._sum.total || 0,
    orders: totalOrders,
    products: totalProducts,
    users: totalUsers,
    revenueData,
    salesData,
    topBrands,
    metrics: {
      paid: paidOrders,
      unpaid: unpaidOrders,
      pending: pendingOrders,
      confirmed: confirmedOrders,
      processing: processingOrders,
      shipped: shippedOrders,
      delivered: deliveredOrders,
      cancelled: cancelledOrders
    }
  });
});

// @desc    Register a manual physical in-store sale
// @route   POST /api/orders/physical
// @access  Private/Admin
export const registerPhysicalSale = asyncHandler(async (req, res) => {
  const { productId, size, color } = req.body;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  
  if (product.stock < 1) {
    res.status(400); 
    throw new Error('Product is completely out of stock globally!');
  }

  let sizeStock = product.sizeStock || {};
  if (typeof sizeStock === 'string') sizeStock = JSON.parse(sizeStock);

  if (!sizeStock[size] || sizeStock[size] < 1) {
    res.status(400); 
    throw new Error(`Size ${size} is completely sold out!`);
  }

  const now = new Date();
  
  const isSaleActive = (() => {
    if (!product.salePrice) return false;
    if (Number(product.salePrice) >= Number(product.price)) return false;
    if (product.saleStartDate) {
      const startDate = new Date(product.saleStartDate);
      startDate.setHours(0, 0, 0, 0);
      if (now.getTime() < startDate.getTime()) return false;
    }
    if (product.saleEndDate) {
      const endDate = new Date(product.saleEndDate);
      endDate.setHours(23, 59, 59, 999);
      if (now.getTime() > endDate.getTime()) return false;
    }
    return true;
  })();

  const activePrice = isSaleActive ? product.salePrice : product.price;

  // Generate an instant literal completed Order entry
  const order = await prisma.order.create({
    data: {
      userId: req.user.id,
      total: activePrice,
      status: 'DELIVERED',
      isPaid: true,
      paymentMethod: 'CASH',
      shippingAddress: {
        fullName: 'Physical In-Store Walk-in',
        email: 'N/A',
        address: 'POS Terminal',
        city: 'In-Store',
        postalCode: '00000',
        phone: 'N/A'
      },
      orderItems: {
        create: [
          {
            productId: product.id,
            quantity: 1,
            price: activePrice,
            size: size || 'N/A',
            color: color || 'N/A'
          }
        ]
      }
    },
    include: { orderItems: true }
  });

  // Exactly replicate hardware stock depletion directly targeting the Size Dict
  sizeStock[size] -= 1;
  await prisma.product.update({
    where: { id: product.id },
    data: { 
      stock: { decrement: 1 },
      sizeStock,
      sold: { increment: 1 }
    }
  });

  res.status(201).json(order);
});
