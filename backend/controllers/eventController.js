import { Event } from '../models/Event.js';
import { Registration } from '../models/Registration.js';

import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

// Helper function to send Discord Webhook
const notifyDiscord = async (webhookUrl, event, organizerName) => {
  if (!webhookUrl) return;
  try {
    const payload = {
      content: `🎉 New Event Alert from **${organizerName}**!`,
      embeds: [
        {
          title: event.eventName || event.title,
          description: event.eventDescription || event.description,
          color: 5814783, // Indigo color
          fields: [
            { name: 'Dates', value: `${new Date(event.startDate || event.date).toLocaleDateString()} to ${new Date(event.endDate || event.date).toLocaleDateString()}`, inline: true },
            { name: 'Category', value: event.category || 'General', inline: true },
            { name: 'Venue', value: event.venue || 'TBA', inline: true }
          ],
          footer: { text: 'Register now on the Felicity Portal!' }
        }
      ]
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error('Failed to notify Discord:', error.message);
  }
};

// get all events with advanced filtering
export const getAllEvents = async (req, res) => {
  try {
    const { search, startDate, endDate, followedClubsOnly } = req.query;
    let query = {};

    // 1. Auth & User Context (Moved to top so filters can use it)
    const token = req.cookies?.jwt || req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey');
        req.user = await User.findById(decoded.userId);
      } catch (err) {
        console.log('Token verification failed for public route', err.message);
      }
    }

    // 2. Regex text matching for Event Name
    if (search) {
      query.$or = [
        { eventName: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } }
      ];
    }

    // 3. Date ranges
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    // 4. Followed Clubs Filtering
    if (followedClubsOnly === 'true' && req.user && req.user.followedClubs) {
      query.organiserId = { $in: req.user.followedClubs };
    }

    // fetching all events from the database matching the query
    let events = await Event.find(query).populate('organiserId', 'name email').sort({ createdAt: -1 });

    // 5. Recommendation logic: if user exists, extract user's interests
    if (req.user && req.user.interests && req.user.interests.length > 0) {
      const userInterests = req.user.interests;
      events = events.sort((a, b) => {
        const aMatches = userInterests.includes(a.category) ? 1 : 0;
        const bMatches = userInterests.includes(b.category) ? 1 : 0;
        return bMatches - aMatches; // Put matches first
      });
    }

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
    const event = await Event.findById(id).populate('organiserId', 'name email').lean();

    if (!event) {
      return res.status(404).json({ message: 'event not found' });
    }

    // append currentRegistrations for strict UI limit blocking
    const currentRegistrations = await Registration.countDocuments({ eventId: id });
    event.currentRegistrations = currentRegistrations;

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
      eventName,
      eventDescription,
      eventType,
      category,
      eligibility,
      registrationDeadline,
      startDate,
      endDate,
      registrationLimit,
      fee,
      venue,
      tags,
      stockQuantity,
      purchaseLimit,
      status,
      customFormFields
    } = req.body;

    // validating base fields based on the new schema
    const missingFields = [];
    if (!eventName) missingFields.push('eventName');
    if (!eventDescription) missingFields.push('eventDescription');
    if (!eventType) missingFields.push('eventType');
    if (!category) missingFields.push('category');
    if (!eligibility) missingFields.push('eligibility');
    if (!registrationDeadline) missingFields.push('registrationDeadline');
    if (!startDate) missingFields.push('startDate');
    if (!endDate) missingFields.push('endDate');
    if (!registrationLimit) missingFields.push('registrationLimit');
    if (!venue) missingFields.push('venue');

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // linking the event to the logged in organiser
    const event = new Event({
      eventName,
      eventDescription,
      title: eventName,       // Fallback for older frontend components expecting 'title'
      description: eventDescription, // Fallback for older frontend components expecting 'description'
      date: startDate,        // Fallback for older frontend components
      eventType,
      category,
      eligibility,
      registrationDeadline,
      startDate,
      endDate,
      registrationLimit,
      fee: fee || 0,
      venue,
      tags: tags || [],
      stockQuantity: stockQuantity || 0,
      purchaseLimit: purchaseLimit || 1,
      status: status || 'Draft',
      customFormFields: customFormFields || [],
      organiserId: req.user._id,
    });

    await event.save();

    // Trigger Discord POST if Published
    if (event.status === 'Published') {
      const user = await User.findById(req.user._id);
      if (user && user.discordWebhookUrl) {
        notifyDiscord(user.discordWebhookUrl, event, user.organizerName || user.name);
      }
    }

    res.status(201).json({
      message: 'event created successfully',
      event,
    });
  } catch (error) {
    console.log('create event error:', error.message);
    res.status(500).json({ message: 'server error while creating event' });
  }
};

// delete an event
// delete an event
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'event not found' });
    }

    // 1. Is the user an Admin? (Check this FIRST so it bypasses everything else)
    const isAdmin = req.user.role === 'Admin' || req.user.role === 'admin';

    // 2. Safely check if the user is the Organiser (avoids the 'toString' crash on broken events)
    const isOrganiser = event.organiserId && event.organiserId.toString() === req.user._id.toString();

    // 3. Fallback just in case old events used the American spelling
    const isOldOrganizer = event.organizerId && event.organizerId.toString() === req.user._id.toString();

    // If they are not an admin and not the organiser, block them
    if (!isAdmin && !isOrganiser && !isOldOrganizer) {
      return res.status(403).json({ message: 'you do not have permission to delete this event' });
    }

    await Event.findByIdAndDelete(id);

    res.status(200).json({
      message: 'event deleted successfully',
    });
  } catch (error) {
    console.log('delete event error:', error.message);
    res.status(500).json({ message: 'server error while deleting event' });
  }
};

// get events by organiser
export const getOrganizerEvents = async (req, res) => {
  try {
    const events = await Event.find({ organiserId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({
      message: 'Organiser events fetched successfully',
      events,
    });
  } catch (error) {
    console.log('get organizer events error:', error.message);
    res.status(500).json({ message: 'server error while fetching events' });
  }
};

// update event status
export const updateEventStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'event not found' });
    }

    if (event.organiserId.toString() !== req.user._id.toString() && req.user.role !== 'Admin' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'unauthorized to update this event' });
    }

    const oldStatus = event.status;
    event.status = status;
    await event.save();

    // Trigger Discord if transitioned to Published
    if (oldStatus === 'Draft' && status === 'Published') {
      const user = await User.findById(req.user._id);
      if (user && user.discordWebhookUrl) {
        notifyDiscord(user.discordWebhookUrl, event, user.organizerName || user.name);
      }
    }

    res.status(200).json({
      message: 'status updated successfully',
      event,
    });
  } catch (error) {
    console.log('update event status error:', error.message);
    res.status(500).json({ message: 'server error while updating status' });
  }
};

// update entire event (handles strict locking)
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'event not found' });
    }

    if (event.organiserId.toString() !== req.user._id.toString() && req.user.role !== 'Admin' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'unauthorized to update this event' });
    }

    const oldStatus = event.status;

    // Apply strict rules based on current status
    if (oldStatus === 'Draft') {
      // Can update everything
      Object.assign(event, updates);
    } else if (oldStatus === 'Published') {
      // Only specific fields allowed to be updated
      if (updates.eventDescription) event.eventDescription = updates.eventDescription;
      if (updates.description) event.description = updates.description;
      if (updates.stockQuantity !== undefined) event.stockQuantity = updates.stockQuantity;
      if (updates.purchaseLimit !== undefined) event.purchaseLimit = updates.purchaseLimit;
      // The frontend will validate dates, we just apply them here securely
      if (updates.registrationDeadline) event.registrationDeadline = updates.registrationDeadline;
      if (updates.registrationLimit) event.registrationLimit = updates.registrationLimit;
      if (updates.status === 'Closed') event.status = 'Closed';
    } else {
      // Custom edits blocked for Ongoing / Completed, only status changes allowed
      if (updates.status === 'Completed' || updates.status === 'Closed') {
        event.status = updates.status;
      } else {
        return res.status(400).json({ message: 'Cannot edit event details when ongoing/completed.' });
      }
    }

    await event.save();

    if (oldStatus === 'Draft' && event.status === 'Published') {
      const user = await User.findById(req.user._id);
      if (user && user.discordWebhookUrl) {
        notifyDiscord(user.discordWebhookUrl, event, user.organizerName || user.name);
      }
    }

    res.status(200).json({
      message: 'event updated successfully',
      event,
    });
  } catch (error) {
    console.log('update event error:', error.message);
    res.status(500).json({ message: 'server error while updating event' });
  }
};

// get event participants
export const getEventParticipants = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'event not found' });
    }

    if (event.organiserId.toString() !== req.user._id.toString() && req.user.role !== 'Admin' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'unauthorized to view these participants' });
    }

    const registrations = await Registration.find({ eventId: id }).populate('participantId', 'firstName lastName email name');

    res.status(200).json({
      message: 'participants fetched successfully',
      registrations,
    });
  } catch (error) {
    console.log('get event participants error:', error.message);
    res.status(500).json({ message: 'server error while fetching participants' });
  }
};

// get trending events (Top 5 created in last 24 hours based on registrations)
export const getTrendingEvents = async (req, res) => {
  try {
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    // Get events created in last 24 hours
    const recentEvents = await Event.find({ createdAt: { $gte: yesterday }, status: { $in: ['Published', 'Ongoing'] } }).populate('organiserId', 'name email');

    // Fetch registration counts for these events
    const trending = await Promise.all(recentEvents.map(async (event) => {
      const regCount = await Registration.countDocuments({ eventId: event._id });
      return { event, regCount };
    }));

    // Sort descending and take top 5
    trending.sort((a, b) => b.regCount - a.regCount);
    const topEvents = trending.slice(0, 5).map(t => t.event);

    res.status(200).json({
      message: 'trending events fetched successfully',
      events: topEvents
    });
  } catch (error) {
    console.log('trending events error:', error.message);
    res.status(500).json({ message: 'server error while fetching trending events' });
  }
};