import express from 'express';
import { registerForEvent, getEventRegistrations, getMyRegistrations } from '../controllers/registrationController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// route to get registrations for an organizer's event
router.get('/event/:eventId', protect, authorizeRoles(['Organizer']), getEventRegistrations);

// route to get all registrations for a participant
router.get('/my-registrations', protect, authorizeRoles(['Participant']), getMyRegistrations);

// route to register a participant for an event
router.post('/:eventId', protect, authorizeRoles(['Participant']), registerForEvent);

export default router;
