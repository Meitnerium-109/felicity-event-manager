import { Event } from '../models/Event.js';
import { Registration } from '../models/Registration.js';
import { User } from '../models/User.js';
import QRCode from 'qrcode';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail.js';

// get all registrations for an organiser's event
export const getEventRegistrations = async (req, res) => {
  try {
    const { eventId } = req.params;

    // checking if the event exists and belongs to the logged-in organiser
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'event not found' });
    }

    if (event.organiserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'you can only view registrations for your own events' });
    }

    // getting all registrations for this event with participant details
    const registrations = await Registration.find({ eventId }).populate(
      'participantId',
      'email name role'
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
      'title description date venue category'
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

    // 1. checking if the event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'event not found' });
    }

    // 2. Merchandise Stock Validation
    if (event.eventType === 'Merchandise') {
      if (!event.stockQuantity || event.stockQuantity <= 0) {
        return res.status(400).json({ message: 'Out of stock' });
      }
    }

    // 3. checking if the capacity has been reached
    const limit = event.registrationLimit || event.capacity;
    if (limit) {
      const registrationCount = await Registration.countDocuments({ eventId });
      if (registrationCount >= limit) {
        return res.status(400).json({ message: 'event is full, no more registrations allowed' });
      }
    }

    // 4. checking if participant is already registered
    const existingRegistration = await Registration.findOne({
      eventId,
      participantId: req.user._id,
    });

    if (existingRegistration) {
      return res.status(400).json({ message: 'you are already registered for this event' });
    }

    // 5. Generate Unique Ticket ID
    const ticketId = crypto.randomBytes(4).toString('hex').toUpperCase();

    // 6. creating the registration
    const registration = new Registration({
      eventId,
      participantId: req.user._id,
      ticketId,
      // store any answers or itemSelections from req.body if provided
      answers: req.body.answers || [],
      itemSelections: req.body.itemSelections || []
    });

    await registration.save();

    // 7. Decrement stock if merchandise
    if (event.eventType === 'Merchandise') {
      event.stockQuantity -= 1;
      await event.save();
    }

    // 8. Generate QR Code and Send Email
    try {
      // Create user string data for QR
      const qrData = JSON.stringify({
        ticketId,
        eventId,
        userId: req.user._id
      });

      const qrCodeBase64 = await QRCode.toDataURL(qrData);

      const user = await User.findById(req.user._id);

      // Construct HTML Email
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #4F46E5; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Registration Confirmed!</h1>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333;">Hi <strong>${user.name}</strong>,</p>
            <p style="font-size: 16px; color: #333;">You have successfully registered for <strong>${event.eventName || event.title}</strong>.</p>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 25px 0; text-align: center;">
              <p style="margin: 0; font-size: 14px; color: #666; text-transform: uppercase;">Your Ticket ID</p>
              <h2 style="margin: 10px 0 0 0; color: #111827; letter-spacing: 2px;">${ticketId}</h2>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="font-size: 14px; color: #666; margin-bottom: 10px;">Your entry QR Code</p>
              <img src="${qrCodeBase64}" alt="Ticket QR Code" style="width: 200px; height: 200px; border: 1px solid #ddd; border-radius: 10px;" />
            </div>

            <p style="font-size: 14px; color: #666; padding-top: 20px; border-top: 1px solid #eee;">
              Please show this QR code at the event venue. If this is a merchandise purchase, show this ticket to collect your items.
            </p>
          </div>
        </div>
      `;

      await sendEmail({
        to: user.email,
        subject: `Your Ticket for ${event.eventName || event.title}`,
        html: emailHtml
      });

    } catch (emailError) {
      console.error('Failed to generate QR or send email:', emailError);
      // We don't block the request if email fails, registration is already saved.
    }

    res.status(201).json({
      message: 'registered for event successfully',
      registration,
    });
  } catch (error) {
    console.log('register for event error:', error.message);
    res.status(500).json({ message: 'server error while registering for event' });
  }
};

// cancel a registration
export const cancelRegistration = async (req, res) => {
  try {
    const { id } = req.params;

    const registration = await Registration.findById(id);

    if (!registration) {
      return res.status(404).json({ message: 'registration not found' });
    }

    if (registration.participantId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'you can only cancel your own registrations' });
    }

    await Registration.findByIdAndDelete(id);

    res.status(200).json({ message: 'registration cancelled successfully' });
  } catch (error) {
    console.log('cancel registration error:', error.message);
    res.status(500).json({ message: 'server error while cancelling registration' });
  }
};

// get detailed participant history
export const getParticipantHistory = async (req, res) => {
  try {
    const registrations = await Registration.find({ participantId: req.user._id })
      .populate({
        path: 'eventId',
        select: 'eventName title eventType status startDate date organiserId',
        populate: {
          path: 'organiserId',
          select: 'name email'
        }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Participant history fetched successfully',
      registrations,
    });
  } catch (error) {
    console.log('get participant history error:', error.message);
    res.status(500).json({ message: 'server error while fetching history' });
  }
};