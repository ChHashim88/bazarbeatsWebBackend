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
  if (!process.env.DATABASE_URL) {
    console.error('✘ Database Error: DATABASE_URL is not defined in .env');
    return false;
  }

  try {
    // We add a 30-second timeout for the initial connection attempt
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('MongoDB Connection Timeout (30s)')), 30000)
    );
    
    console.log('... Verifying MongoDB Connection');
    await Promise.race([prisma.$connect(), timeout]);
    console.log('✔ MongoDB Connection Verified');
    return true;
  } catch (error) {
    console.error('✘ Database Error:', error.message);
    if (error.message.includes('Timeout')) {
      console.error('TIP: Check if your IP is whitelisted in MongoDB Atlas.');
    }
    return false;
  }
};

export default prisma;
