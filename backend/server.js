import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import registrationRoutes from './routes/registrationRoutes.js';
import userRoutes from './routes/userRoutes.js';

// load env vars
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- 1. MIDDLEWARE (Declared exactly once, in order) ---
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// --- 2. ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/users', userRoutes);

import { seedAdmin } from './utils/seedAdmin.js';

// --- 3. DATABASE & SERVER ---
connectDB().then(() => {
  seedAdmin();
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'server is running' });
});

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});