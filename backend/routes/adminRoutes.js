import express from 'express';
import { createOrganizer } from '../controllers/adminController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// route to create a new organizer (admin only)
router.post('/organizers', protect, authorizeRoles(['Admin']), createOrganizer);

export default router;
