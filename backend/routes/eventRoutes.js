import express from 'express';
import { createEvent, updateEvent, getAllEvents, getEventById, deleteEvent, getOrganizerEvents, updateEventStatus, getEventParticipants, getTrendingEvents } from '../controllers/eventController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// route to get all events for regular fetching (public)
router.get('/', getAllEvents);

// route to get events specifically for the logged in organiser
router.get('/organizer', protect, authorizeRoles(['Organizer', 'organiser', 'Organiser']), getOrganizerEvents);

// route to get trending events (public)
router.get('/trending', getTrendingEvents);

// route to get a specific event by id (public)
router.get('/:id', getEventById);

// route to get participants for a specific event (organizer only)
router.get('/:id/participants', protect, authorizeRoles(['Organizer', 'organiser', 'Organiser']), getEventParticipants);

// route to create a new event (organizer only)
router.post('/', protect, authorizeRoles(['Organizer', 'organiser', 'Organiser']), createEvent);

// route to update event status (organizer only)
router.put('/:id/status', protect, authorizeRoles(['Organizer', 'organiser', 'Organiser']), updateEventStatus);

// route to update full event details (organizer only)
router.put('/:id', protect, authorizeRoles(['Organizer', 'organiser', 'Organiser']), updateEvent);

// route to delete an event (organizer or admin)
router.delete('/:id', protect, authorizeRoles(['Organizer', 'organiser', 'Organiser', 'Admin', 'admin']), deleteEvent);

export default router;
