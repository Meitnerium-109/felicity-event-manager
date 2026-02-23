import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema(
  {
    fieldName: String,
    response: mongoose.Schema.Types.Mixed, // can be string, number, etc
  },
  { _id: false }
);

const itemSelectionSchema = new mongoose.Schema(
  {
    size: String,
    colour: String,
    quantity: Number,
  },
  { _id: false }
);

const registrationSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  participantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  answers: {
    type: [answerSchema],
    // custom form responses from the event
  },
  transactionId: {
    type: String,
    // for normal events with registration fees
  },
  itemSelections: {
    type: [itemSelectionSchema],
    // for merchandise events
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Registration = mongoose.model('Registration', registrationSchema);
