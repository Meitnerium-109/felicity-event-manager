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
  firstName: String,
  lastName: String,
  participantType: {
    type: String,
    enum: ['IIIT', 'Non-IIIT'],
  },
  interests: {
    type: [String],
  },
  followedClubs: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
  },

  // Organiser-only fields
  organizerName: String,
  contactEmail: String,
  category: {
    type: String,
    enum: ['Technical', 'Cultural', 'Sports', 'Other'],
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
  discordWebhookUrl: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const User = mongoose.model('User', userSchema);