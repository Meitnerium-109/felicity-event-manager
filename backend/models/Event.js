import mongoose from 'mongoose';

const customFormSchema = new mongoose.Schema(
  {
    fieldName: {
      type: String,
      required: true,
    },
    fieldType: {
      type: String,
      required: true, // like 'text', 'email', 'number', 'select', etc
    },
    isRequired: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const itemDetailSchema = new mongoose.Schema(
  {
    size: String,
    colour: String,
    stock: Number,
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema({
  // common fields for all events
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['Normal', 'Merchandise'],
    required: true,
  },
  eligibility: {
    type: String,
    enum: ['IIIT', 'All'],
    required: true,
  },
  registrationDeadline: {
    type: Date,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  registrationLimit: {
    type: Number,
    required: true,
  },
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // normal event fields
  registrationFee: {
    type: Number,
    // only for normal events
  },
  eventTags: {
    type: [String], // like 'workshop', 'hackathon', etc
  },
  customForm: {
    type: [customFormSchema],
    // array of custom form fields for registration
  },

  // merchandise event fields
  itemDetails: {
    type: [itemDetailSchema],
    // array of items with size, colour, stock
  },
  purchaseLimit: {
    type: Number,
    // max items a person can buy
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// NOTE: event status (ongoing, closed) will be computed dynamically
// using the start and end dates when needed in the API

export const Event = mongoose.model('Event', eventSchema);
