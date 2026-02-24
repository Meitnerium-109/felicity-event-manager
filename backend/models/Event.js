import mongoose from 'mongoose';

const customFieldSchema = new mongoose.Schema({
  label: { type: String, required: true },
  type: { type: String, enum: ['text', 'dropdown', 'checkbox', 'file'], required: true },
  options: [{ type: String }], // Required if type is dropdown or checkbox
  isRequired: { type: Boolean, default: false }
});

const eventSchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: true,
  },
  eventDescription: {
    type: String,
    required: true,
  },
  eventType: {
    type: String,
    enum: ['Normal', 'Merchandise'],
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['Technical', 'Cultural', 'Sports', 'Social', 'Academic'],
  },
  eligibility: {
    type: String,
    enum: ['IIIT', 'Non-IIIT', 'All'],
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
  fee: {
    type: Number,
    default: 0,
  },
  venue: {
    type: String,
    required: true,
  },
  tags: [{
    type: String
  }],
  stockQuantity: {
    type: Number,
    default: 0
  },
  purchaseLimit: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Ongoing', 'Completed', 'Closed'],
    default: 'Draft',
  },
  customFormFields: [customFieldSchema], // Embedded subdocument array
  organiserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Event = mongoose.model('Event', eventSchema);