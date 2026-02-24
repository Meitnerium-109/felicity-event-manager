import express from 'express';
import { registerForEvent, getEventRegistrations, getMyRegistrations, cancelRegistration, getParticipantHistory, reviewMerchandiseOrder, markAttendance } from '../controllers/registrationController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// route to get registrations for an organizer's event
router.get('/event/:eventId', protect, authorizeRoles(['Organizer']), getEventRegistrations);

// route to get all registrations for a participant (legacy)
router.get('/my-registrations', protect, authorizeRoles(['Participant']), getMyRegistrations);

// route to get detailed participant history
router.get('/history', protect, authorizeRoles(['Participant', 'participant']), getParticipantHistory);

// route to review a merchandise order
router.put('/review/:registrationId', protect, authorizeRoles(['Organizer', 'organiser']), reviewMerchandiseOrder);

// route to mark attendance via QR scan or manual override
router.put('/attendance', protect, authorizeRoles(['Organizer', 'organiser']), markAttendance);

// route to register a participant for an event
router.post('/:eventId', protect, authorizeRoles(['Participant']), registerForEvent);

// route to cancel a registration
router.delete('/:id', protect, authorizeRoles(['Participant']), cancelRegistration);

export default router;
