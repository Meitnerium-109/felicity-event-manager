import { Event } from '../models/Event.js';

// get all events
export const getAllEvents = async (req, res) => {
  try {
    // fetching all events from the database
    const events = await Event.find().populate('organiserId', 'name email');

    res.status(200).json({
      message: 'events fetched successfully',
      events,
    });
  } catch (error) {
    console.log('get all events error:', error.message);
    res.status(500).json({ message: 'server error while fetching events' });
  }
};

// get a single event by id
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    // finding the specific event
    const event = await Event.findById(id).populate('organiserId', 'name email');

    if (!event) {
      return res.status(404).json({ message: 'event not found' });
    }

    res.status(200).json({
      message: 'event fetched successfully',
      event,
    });
  } catch (error) {
    console.log('get event by id error:', error.message);
    res.status(500).json({ message: 'server error while fetching event' });
  }
};

// create a new event
export const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      venue,
      capacity,
      category,
    } = req.body;

    // validating required fields based on the simple frontend form
    if (!title || !description || !date || !venue || !category) {
      return res.status(400).json({ message: 'missing required event fields' });
    }

    // linking the event to the logged in organiser
    const event = new Event({
      title,
      description,
      date,
      venue,
      capacity: capacity || null,
      category,
      organiserId: req.user._id,
    });

    await event.save();

    res.status(201).json({
      message: 'event created successfully',
      event,
    });
  } catch (error) {
    console.log('create event error:', error.message);
    res.status(500).json({ message: 'server error while creating event' });
  }
};