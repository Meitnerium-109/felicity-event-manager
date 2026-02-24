import express from 'express';
import { updateProfile, changePassword, getAllActiveOrganisers, getOrganiserPublicProfile } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// route to update profile
router.put('/profile', protect, updateProfile);

// route to change password
router.put('/change-password', protect, changePassword);

// route to get all active organisers
router.get('/organisers', protect, getAllActiveOrganisers);

// route to get a specific public organiser profile + their events
router.get('/organisers/:id', protect, getOrganiserPublicProfile);

export default router;
