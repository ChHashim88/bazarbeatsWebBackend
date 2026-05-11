import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Absolute basic test route
app.get('/', (req, res) => {
  res.send('<h1>BazarBeats API is Online</h1><p>If you see this, the server is working perfectly.</p>');
});

// Import the rest of the app logic from src
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

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('✔ Server started on port', PORT);
  // Temporarily disabled DB connection to isolate 503 error
  // connectDB(); 
});
