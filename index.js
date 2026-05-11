import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Route Imports from src
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

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: '*', credentials: true }));

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

// Static Uploads
const _root = path.resolve();
app.use('/uploads', express.static(path.join(_root, '/uploads')));

// Diagnostics
app.get('/health', async (req, res) => {
  const isConnected = await connectDB();
  res.status(200).json({ status: 'ONLINE', database: isConnected ? 'CONNECTED' : 'FAILED' });
});

app.get('/', (req, res) => {
  res.json({ message: 'BazarBeats API', status: 'Ready', port: process.env.PORT || 3000 });
});

// Error Handling
app.use(notFound);
app.use(errorHandler);

// Listen on Hostinger-provided port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✔ Server live on port ${PORT}`);
  connectDB();
});
