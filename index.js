import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// 1. Initialize Environment Variables
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 2. Database & Middleware Imports
import userRoutes from './src/routes/userRoutes.js';
import productRoutes from './src/routes/productRoutes.js';
import categoryRoutes from './src/routes/categoryRoutes.js';
import orderRoutes from './src/routes/orderRoutes.js';
import cartRoutes from './src/routes/cartRoutes.js';
import uploadRoutes from './src/routes/uploadRoutes.js';
import settingsRoutes from './src/routes/settingsRoutes.js';
import brandRoutes from './src/routes/brandRoutes.js';
import messageRoutes from './src/routes/messageRoutes.js';
import { notFound, errorHandler } from './src/middlewares/errorMiddleware.js';
import { connectDB } from './src/config/db.js';

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

// 4. Status Route (Replaces basic '/' routes)
let globalDbStatus = 'Connecting...';
app.get('/', (req, res) => {
  res.send(`
    <div style="font-family: sans-serif; padding: 2rem; background: #0f172a; color: #f8fafc; min-height: 100vh;">
      <h1 style="color: #38bdf8;">BazarBeats API Status</h1>
      <p style="font-size: 1.2rem;"><b>Server:</b> <span style="color: #4ade80;">Online ✔</span></p>
      <p style="font-size: 1.2rem;"><b>Database:</b> <span style="${globalDbStatus.includes('CONNECTED') ? 'color: #4ade80;' : 'color: #f87171;'}">${globalDbStatus}</span></p>
      <hr style="border: 0; border-top: 1px solid #334155; margin: 1.5rem 0;">
      <p style="color: #94a3b8;">Node Version: ${process.version}</p>
      <p style="color: #94a3b8;">Uptime: ${Math.floor(process.uptime())}s</p>
    </div>
  `);
});

// 5. Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

// 6. Global Process Error Handlers (Crucial for stability)
process.on('uncaughtException', (err) => {
  console.error('FATAL: Uncaught Exception:', err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('FATAL: Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// 7. Server Boot
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`✔ Server started on port ${PORT}`);
  
  // Attempt DB Connection
  setTimeout(() => {
    connectDB().then(success => {
      globalDbStatus = success ? 'CONNECTED ✔' : 'FAILED ✘';
    });
  }, 1000);
});

// Graceful Shutdown
const shutdown = (signal) => {
  console.log(`\nReceived ${signal}. Shutting down server...`);
  server.close(() => {
    console.log('Server terminated safely.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
