import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import brandRoutes from './routes/brandRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import { notFound, errorHandler } from './middlewares/errorMiddleware.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- STABILITY BOOTSTRAP ---
console.log("Environment Check:", {
  NODE_ENV: process.env.NODE_ENV,
  HAS_DB_URL: !!process.env.DATABASE_URL,
  PORT: process.env.PORT
});

// Load .env only if not already provided by Hostinger Dashboard
if (!process.env.DATABASE_URL) {
  console.log("Loading variables from local .env file...");
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
} else {
  console.log("Using Hostinger Dashboard environment variables.");
}

// --- STABILITY BOILERPLATE ---
// 1. Validate Critical Environment Variables
const requiredEnvs = ['DATABASE_URL', 'CLOUDINARY_CLOUD_NAME'];
requiredEnvs.forEach(env => {
  if (!process.env[env]) {
    console.error(`FATAL ERROR: ${env} is not defined in .env file.`);
  }
});

// 2. Global Error Handlers (Prevents the process from dying silently)
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message, err.stack);
  // Give the server time to log before exiting
  setTimeout(() => process.exit(1), 1000);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message, err.stack);
  // In production, we might not want to exit for rejections, but logging is vital
});
// -----------------------------

import { connectDB } from './config/db.js';

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
}));
app.use(morgan('dev'));

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/messages', messageRoutes);

// Statically serve the uploads folder
const _dirname = path.resolve();
app.use('/uploads', express.static(path.join(_dirname, '/uploads')));

// Deep Health Check Route
app.get('/health', async (req, res) => {
  let dbStatus = 'Checking...';
  try {
    // Try a simple count query to see if DB is responsive
    await prisma.user.count();
    dbStatus = 'Connected ✔';
  } catch (err) {
    dbStatus = `Failed: ${err.message}`;
  }

  res.status(200).json({ 
    status: 'OK', 
    uptime: `${Math.floor(process.uptime())}s`,
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'BazarBeats API is live',
    version: '1.1.0',
    env: process.env.NODE_ENV,
    port: process.env.PORT || 5000
  });
});

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Start server immediately
app.listen(PORT, () => {
  console.log(`✔ Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  
  // Connect to Database in the background
  connectDB().catch(err => {
    console.error('✘ Delayed MongoDB Connection Error:', err.message);
  });
});
