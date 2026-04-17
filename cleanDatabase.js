import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDB() {
  try {
    console.log('🧹 Preparing to securely scrub the database catalog...');

    // 1. Delete dependent records first to avoid foreign key constraints!
    console.log('Deleting all CartItems...');
    const cartItems = await prisma.cartItem.deleteMany({});
    console.log(`Deleted ${cartItems.count} cart items.`);

    console.log('Deleting all OrderItems...');
    const orderItems = await prisma.orderItem.deleteMany({});
    console.log(`Deleted ${orderItems.count} order items.`);

    console.log('Deleting all Reviews...');
    const reviews = await prisma.review.deleteMany({});
    console.log(`Deleted ${reviews.count} reviews.`);

    // 2. Now we can safely delete the actual Products!
    console.log('Terminating all Products...');
    const products = await prisma.product.deleteMany({});
    console.log(`✅ Successfully wiped ${products.count} old products from the database!`);

    console.log('\nStore is completely clean and ready for fresh inventory.');
  } catch (error) {
    console.error('Failed to clean database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDB();
