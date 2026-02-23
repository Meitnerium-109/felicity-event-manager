import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  // Common fields for all users
  name: {
    type: String,
    required: true,
  },
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
    enum: [
      'Participant', 'participant', 
      'Organiser', 'organiser', 'Organizer', 'organizer', 
      'Admin', 'admin'
    ], 
    required: true,
  },

  // Participant-only fields
  participantType: {
    type: String,
    enum: ['IIIT', 'Non-IIIT'],
  },
  areasOfInterest: {
    type: [String], 
  },
  followedClubs: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
  },

  // Organiser-only fields
  category: {
    type: String,
    enum: ['Technical', 'Cultural', 'Sports', 'Social', 'Academic'],
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