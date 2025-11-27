import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

import authRoutes from './routes/authRoutes';

import faqRoutes from './routes/faqRoutes';
import searchRoutes from './routes/searchRoutes';
import chatRoutes from './routes/chatRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('FATAL ERROR: MONGO_URI is not defined. Please check your .env file.');
  process.exit(1);
}

// Middleware
app.use(express.json());
app.use(cors()); // Enable CORS for all routes

// Request logging
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use(limiter);

// Basic Route
app.get('/', (req, res) => {
  res.send('AI Chat Backend API is running!');
});

// Auth Routes
app.use('/api/auth', authRoutes);



// FAQ Routes
app.use('/api/faqs', faqRoutes);

// Search Routes
app.use('/api/search', searchRoutes);

// Chat Routes
app.use('/api/chat', chatRoutes);

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
