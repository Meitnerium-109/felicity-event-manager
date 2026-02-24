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

    // 2. Merchandise Validation
    if (event.eventType === 'Merchandise') {
      if (!event.stockQuantity || event.stockQuantity <= 0) {
        return res.status(400).json({ message: 'Out of stock' });
      }
      if (!req.body.paymentProof) {
        return res.status(400).json({ message: 'Payment screenshot represents a mandatory field for merchandise.' });
      }
    }

    const isMerch = event.eventType === 'Merchandise';

    // 3. checking if the capacity has been reached
    const limit = event.registrationLimit || event.capacity;
    if (limit && !isMerch) {
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

    if (existingRegistration && !isMerch) {
      return res.status(400).json({ message: 'you are already registered for this event' });
    }

    // For merch, optionally enforce a purchase limit check here if needed later, but skip the duplicate check for now so they can buy multiple "orders" if desired, or let's strictly enforce `purchaseLimit`. Let's enforce purchase limit:
    if (existingRegistration && isMerch) {
      // Basic implementation for now: users can only place one order per checkout flow
      return res.status(400).json({ message: 'you have already placed an order for this merchandise' });
    }

    // 5. Generate Unique Ticket ID (Only for non-merchandise at first)
    const ticketId = isMerch ? undefined : crypto.randomBytes(4).toString('hex').toUpperCase();

    // 6. creating the registration
    const registration = new Registration({
      eventId,
      participantId: req.user._id,
      ticketId,
      status: isMerch ? 'Pending Approval' : 'Successful',
      paymentProof: req.body.paymentProof,
      // store any answers or itemSelections from req.body if provided
      answers: req.body.answers || [],
      itemSelections: req.body.itemSelections || []
    });

    await registration.save();

    // 7. For Merchandise, stop here and respond
    if (isMerch) {
      return res.status(201).json({
        message: 'Order placed. Pending Organiser approval.',
        registration,
      });
    }

    // 8. Generate QR Code and Send Email for NON-merchandise
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
              Please show this QR code at the event venue.
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

// Review merchandise order (Organiser Only)
export const reviewMerchandiseOrder = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { reviewStatus } = req.body; // 'Approved' or 'Rejected'

    if (!['Approved', 'Rejected'].includes(reviewStatus)) {
      return res.status(400).json({ message: 'Invalid review status. Must be Approved or Rejected.' });
    }

    // 1. Fetch registration
    const registration = await Registration.findById(registrationId).populate('eventId participantId');
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    const event = registration.eventId;

    // 2. Validate Organiser Security
    if (event.organiserId.toString() !== req.user._id.toString() && event.organizerId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only review orders for your own events' });
    }

    // 3. Prevent duplicate processing
    if (registration.status !== 'Pending Approval') {
      return res.status(400).json({ message: 'This order is already processed.' });
    }

    if (reviewStatus === 'Rejected') {
      registration.status = 'Rejected';
      await registration.save();
      return res.status(200).json({ message: 'Order rejected successfully.', registration });
    }

    // 4. Approved logic: Stock Check
    if (event.stockQuantity <= 0) {
      return res.status(400).json({ message: 'Out of stock! Cannot approve order.' });
    }

    // Generate ticket
    const ticketId = crypto.randomBytes(4).toString('hex').toUpperCase();

    // Decrease Stock
    event.stockQuantity -= 1;
    await event.save();

    // Save registration
    registration.status = 'Successful';
    registration.ticketId = ticketId;
    await registration.save();

    // Generate QR and Send Email
    try {
      const qrData = JSON.stringify({
        ticketId,
        eventId: event._id,
        userId: registration.participantId._id
      });
      const qrCodeBase64 = await QRCode.toDataURL(qrData);

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #10B981; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Merchandise Order Approved!</h1>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333;">Hi <strong>${registration.participantId.name}</strong>,</p>
            <p style="font-size: 16px; color: #333;">Your payment for <strong>${event.eventName || event.title}</strong> has been verified.</p>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 25px 0; text-align: center;">
              <p style="margin: 0; font-size: 14px; color: #666; text-transform: uppercase;">Your Collectable Ticket ID</p>
              <h2 style="margin: 10px 0 0 0; color: #111827; letter-spacing: 2px;">${ticketId}</h2>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="font-size: 14px; color: #666; margin-bottom: 10px;">Your pickup QR Code</p>
              <img src="${qrCodeBase64}" alt="Ticket QR Code" style="width: 200px; height: 200px; border: 1px solid #ddd; border-radius: 10px;" />
            </div>

            <p style="font-size: 14px; color: #666; padding-top: 20px; border-top: 1px solid #eee;">
              Please show this QR code to the organiser to collect your items.
            </p>
          </div>
        </div>
      `;

      await sendEmail({
        to: registration.participantId.email,
        subject: `Order Approved: ${event.eventName || event.title}`,
        html: emailHtml
      });
    } catch (emailError) {
      console.error('Failed to generate QR or send email upon approval:', emailError);
    }

    res.status(200).json({
      message: 'Order approved and ticket dispatched.',
      registration,
    });
  } catch (error) {
    console.log('review merchandise order error:', error.message);
    res.status(500).json({ message: 'server error while reviewing order' });
  }
};

// mark attendance (via QR scan or Manual Override)
export const markAttendance = async (req, res) => {
  try {
    const { ticketId, isManualOverride } = req.body;

    if (!ticketId) {
      return res.status(400).json({ message: 'Ticket ID is required' });
    }

    // 1. Find the registration
    const registration = await Registration.findOne({ ticketId }).populate('eventId participantId');

    if (!registration) {
      return res.status(404).json({ message: 'Invalid Ticket! Registration not found.' });
    }

    const event = registration.eventId;

    // 2. Validate Organiser Security (must own the event)
    if (event.organiserId.toString() !== req.user._id.toString() && event.organizerId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only mark attendance for your own events' });
    }

    // 3. Check if already marked present
    if (registration.attendanceStatus === true) {
      return res.status(400).json({
        message: 'Duplicate scan rejected! Participant already marked present.',
        previousScanTime: registration.attendanceTimestamp,
        participantName: registration.participantId.name
      });
    }

    // 4. Mark attendance
    const now = new Date();
    registration.attendanceStatus = true;
    registration.attendanceTimestamp = now;

    const logEntry = isManualOverride
      ? `Manual Override by Organiser at ${now.toISOString()}`
      : `Scanned via QR at ${now.toISOString()}`;

    registration.auditLog.push(logEntry);

    await registration.save();

    res.status(200).json({
      message: 'Attendance marked successfully!',
      participantName: registration.participantId.name,
      registration
    });

  } catch (error) {
    console.log('mark attendance error:', error.message);
    res.status(500).json({ message: 'Server error while marking attendance.' });
  }
};