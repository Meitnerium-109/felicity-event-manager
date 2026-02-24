import express from 'express';
import { registerParticipant, login, logout, requestPasswordReset } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// register route
router.post('/register', registerParticipant);

// login route
router.post('/login', login);

// logout route (protected, requires auth)
router.post('/logout', protect, logout);

// public route to request a password reset (Organisers)
router.post('/request-reset', requestPasswordReset);

export default router;
