import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

// Route Imports
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Environment Loading (Dashboard First)
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

import { connectDB } from './config/db.js';

const app = express();

// 2. High-Performance Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Professional CORS configuration for cross-domain stability
app.use(cors({
  origin: '*', // Allows all origins during initial deployment
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
  contentSecurityPolicy: false
}));

app.use(morgan('dev'));

// 3. API Routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/messages', messageRoutes);

// Static Uploads
const _root_dir = path.resolve();
app.use('/uploads', express.static(path.join(_root_dir, '/uploads')));

// 4. Diagnostic Routes
app.get('/health', async (req, res) => {
  const isConnected = await connectDB();
  res.status(200).json({ 
    status: 'ONLINE', 
    database: isConnected ? 'CONNECTED' : 'DISCONNECTED',
    uptime: `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'BazarBeats Professional API',
    status: 'Ready',
    node: process.version
  });
});

// 5. Error Handling
app.use(notFound);
app.use(errorHandler);

// 6. Robust Server Boot
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`✔ PROD Server running on Port ${PORT}`);
  
  // Background DB check
  setTimeout(() => {
    connectDB();
  }, 2000);
});

// Graceful Exit
const shutdown = () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server terminated.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
