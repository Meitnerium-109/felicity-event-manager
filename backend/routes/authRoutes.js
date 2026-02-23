import express from 'express';
import { register, login, logout } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// register route
router.post('/register', register);

// login route
router.post('/login', login);

// logout route (protected, requires auth)
router.post('/logout', protect, logout);

export default router;
