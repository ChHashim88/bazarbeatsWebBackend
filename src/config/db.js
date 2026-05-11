import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('✔ MongoDB Connected via Prisma');
  } catch (error) {
    console.error('✘ MongoDB Connection Error:', error.message);
    // On Hostinger, we don't want to exit immediately if the DB is temporarily down,
    // but we should log it clearly.
  }
};

export default prisma;
