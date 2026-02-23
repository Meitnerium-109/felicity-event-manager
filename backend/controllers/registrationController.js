import { Event } from '../models/Event.js';
import { Registration } from '../models/Registration.js';

// get all registrations for an organizer's event
export const getEventRegistrations = async (req, res) => {
  try {
    const { eventId } = req.params;

    // checking if the event exists and belongs to the logged-in organizer
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'event not found' });
    }

    if (event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'you can only view registrations for your own events' });
    }

    // getting all registrations for this event with participant details
    const registrations = await Registration.find({ eventId }).populate(
      'participantId',
      'email firstName lastName participantType'
    );

    res.status(200).json({
      message: 'event registrations fetched successfully',
      registrations,
    });
  } catch (error) {
    console.log('get event registrations error:', error.message);
    res.status(500).json({ message: 'server error while fetching event registrations' });
  }
};

// get all registrations for the logged-in participant
export const getMyRegistrations = async (req, res) => {
  try {
    // finding all registrations for the current participant
    const registrations = await Registration.find({ participantId: req.user._id }).populate(
      'eventId',
      'name description type startDate endDate registrationDeadline'
    );

    res.status(200).json({
      message: 'your registrations fetched successfully',
      registrations,
    });
  } catch (error) {
    console.log('get my registrations error:', error.message);
    res.status(500).json({ message: 'server error while fetching your registrations' });
  }
};

// register a participant for an event
export const registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { answers, transactionId, itemSelections } = req.body;

    // checking if the event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'event not found' });
    }

    // checking if registration deadline has passed
    if (new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({ message: 'registration deadline has passed' });
    }

    // checking if the registration limit has been reached
    const registrationCount = await Registration.countDocuments({ eventId });
    if (registrationCount >= event.registrationLimit) {
      return res.status(400).json({ message: 'event is full, no more registrations allowed' });
    }

    // checking if participant is already registered
    const existingRegistration = await Registration.findOne({
      eventId,
      participantId: req.user._id,
    });
    if (existingRegistration) {
      return res.status(400).json({ message: 'you are already registered for this event' });
    }

    // creating the registration
    const registration = new Registration({
      eventId,
      participantId: req.user._id,
      answers: answers || [],
      transactionId: event.type === 'Normal' ? transactionId : undefined,
      itemSelections: event.type === 'Merchandise' ? itemSelections : undefined,
    });

    await registration.save();

    res.status(201).json({
      message: 'registered for event successfully',
      registration,
    });
  } catch (error) {
    console.log('register for event error:', error.message);
    res.status(500).json({ message: 'server error while registering for event' });
  }
};
