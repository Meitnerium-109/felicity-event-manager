import express from 'express';
import { createEvent, getAllEvents, getEventById } from '../controllers/eventController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// route to get all events (public)
router.get('/', getAllEvents);

// route to get a specific event by id (public)
router.get('/:id', getEventById);

// route to create a new event (organizer only)
router.post('/', protect, authorizeRoles(['Organizer']), createEvent);

export default router;
