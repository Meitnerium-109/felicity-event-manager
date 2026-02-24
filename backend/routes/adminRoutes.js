import express from 'express';
import { createOrganizer, deleteOrganizer, toggleOrganizerStatus, getAllUsers, deleteUser, getResetRequests, reviewResetRequest } from '../controllers/adminController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// route to create a new organizer (admin only)
router.post('/organizers', protect, authorizeRoles(['Admin']), createOrganizer);

// route to delete an organizer by ID and cascade delete events (admin only)
router.delete('/organizers/:id', protect, authorizeRoles(['Admin']), deleteOrganizer);

// route to toggle an organizer's status
router.put('/organizers/:id/toggle-status', protect, authorizeRoles(['Admin']), toggleOrganizerStatus);

// route to get all users
// route to get all users
router.get('/users', protect, authorizeRoles(['Admin']), getAllUsers);

// route to delete a user by ID
router.delete('/users/:id', protect, authorizeRoles(['Admin']), deleteUser);

// get all password reset requests
router.get('/password-resets', protect, authorizeRoles(['Admin', 'admin']), getResetRequests);

// review a password reset request
router.put('/password-resets/:id', protect, authorizeRoles(['Admin', 'admin']), reviewResetRequest);

export default router;
