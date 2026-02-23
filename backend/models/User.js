import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  // common fields for all users
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['Participant', 'Organizer', 'Admin'],
    required: true,
  },

  // participant-only fields
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  participantType: {
    type: String,
    enum: ['IIIT', 'Non-IIIT'],
    // TODO: validate email format (a.b@iiit.ac.in) for IIIT participants
  },
  areasOfInterest: {
    type: [String], // like 'Technical', 'Cultural'
  },
  followedClubs: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
  },

  // organizer-only fields
  name: {
    type: String,
  },
  category: {
    type: String,
    enum: ['Technical', 'Cultural', 'Sports', 'Social', 'Academic'],
    // NOTE: organizer emails should ideally follow name-iiit@clubs.iiit.ac.in format
  },
  collegeName: {
    type: String,
  },
  contactNumber: {
    type: String,
  },
  description: {
    type: String,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const User = mongoose.model('User', userSchema);
