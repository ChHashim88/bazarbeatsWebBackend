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

// Explicitly load the .env from the backend root folder
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
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

// Statically serve the uploads folder for the frontend browser to render
const _dirname = path.resolve();
app.use('/uploads', express.static(path.join(_dirname, '/uploads')));

// Basic Route for testing
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
