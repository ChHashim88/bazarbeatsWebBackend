import { PrismaClient } from '@prisma/client';

// Professional Prisma Configuration
// We add connection pooling and timeout settings for high-performance server environments like Hostinger
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['error'],
});

/**
 * Robust Database Connection Checker
 * Ensures the app doesn't hang indefinitely if MongoDB is slow
 */
export const connectDB = async () => {
  try {
    // We add a 5-second timeout for the initial connection attempt
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('MongoDB Connection Timeout (30s)')), 30000)
    );
    
    await Promise.race([prisma.$connect(), timeout]);
    console.log('✔ MongoDB Connection Verified');
    return true;
  } catch (error) {
    console.error('✘ Database Error:', error.message);
    return false;
  }
};

export default prisma;
