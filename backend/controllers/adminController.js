import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { Event } from '../models/Event.js';
import { PasswordReset } from '../models/PasswordReset.js';

// helper function to generate random password
const generateRandomPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// helper function to generate login email from club name
const generateLoginEmail = (clubName) => {
  // converting club name to lowercase and removing spaces
  const emailPrefix = clubName.toLowerCase().replace(/\s+/g, '');
  return `${emailPrefix}-iiit@clubs.iiit.ac.in`;
};

// create a new organizer account
export const createOrganizer = async (req, res) => {
  try {
    const { name, category, collegeName, contactNumber, description } = req.body;

    // validating required fields
    if (!name || !category || !contactNumber) {
      return res.status(400).json({ message: 'missing required fields' });
    }

    // generating a random password for the club
    const plainPassword = generateRandomPassword();

    // generating login email from club name
    const loginEmail = generateLoginEmail(name);

    // checking if the email already exists
    const existingOrganizer = await User.findOne({ email: loginEmail });
    if (existingOrganizer) {
      return res.status(400).json({ message: 'organizer with this name already exists' });
    }

    // hashing the password
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // creating the organizer user
    const organizer = new User({
      email: loginEmail,
      password: hashedPassword,
      role: 'Organizer',
      name,
      category,
      collegeName: collegeName || '',
      contactNumber,
      description: description || '',
    });

    await organizer.save();

    // returning the plaintext password and login email so admin can share it with the club
    res.status(201).json({
      message: 'organizer account created successfully',
      organizer: {
        _id: organizer._id,
        name: organizer.name,
        role: organizer.role,
        category: organizer.category,
      },
      credentials: {
        loginEmail,
        plainPassword,
        note: 'share these credentials with the club representative',
      },
    });
  } catch (error) {
    console.log('create organizer error:', error.message);
    res.status(500).json({ message: 'server error while creating organizer' });
  }
};

// toggle organizer active status (Archive/Unarchive)
export const toggleOrganizerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const organizer = await User.findById(id);

    if (!organizer || (organizer.role !== 'Organizer' && organizer.role !== 'organiser')) {
      return res.status(404).json({ message: 'organizer not found' });
    }

    organizer.isActive = !organizer.isActive;
    await organizer.save();

    res.status(200).json({
      message: `Organizer practically ${organizer.isActive ? 'unarchived (can login)' : 'archived (cannot login)'} successfully`,
      isActive: organizer.isActive
    });
  } catch (error) {
    console.log('toggle organizer status error:', error.message);
    res.status(500).json({ message: 'server error while toggling organizer status' });
  }
};

// delete an organizer and cascade delete their events
export const deleteOrganizer = async (req, res) => {
  try {
    const { id } = req.params;

    const organizer = await User.findById(id);

    if (!organizer || (organizer.role !== 'Organizer' && organizer.role !== 'organiser')) {
      return res.status(404).json({ message: 'organizer not found' });
    }

    // cascading delete all related events permanently
    await Event.deleteMany({ organiserId: id });
    await Event.deleteMany({ organizerId: id }); // fallback if old spelling exists

    await User.findByIdAndDelete(id);

    res.status(200).json({ message: 'Organiser and all associated events deleted permanently.' });
  } catch (error) {
    console.log('delete organizer error:', error.message);
    res.status(500).json({ message: 'server error while deleting organizer' });
  }
};

// get all users excluding passwords
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({
      message: 'users fetched successfully',
      users
    });
  } catch (error) {
    console.log('get all users error:', error.message);
    res.status(500).json({ message: 'server error while fetching users' });
  }
};

// delete a user by ID
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'user not found' });
    }

    // prevent an admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'you cannot delete your own admin account' });
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({ message: 'user deleted successfully' });
  } catch (error) {
    console.log('delete user error:', error.message);
    res.status(500).json({ message: 'server error while deleting user' });
  }
};

// get all password reset requests
export const getResetRequests = async (req, res) => {
  try {
    const requests = await PasswordReset.find().sort({ createdAt: -1 });
    res.status(200).json({
      message: 'Reset requests fetched successfully',
      requests
    });
  } catch (error) {
    console.log('get reset requests error:', error.message);
    res.status(500).json({ message: 'server error while fetching reset requests' });
  }
};

// review a password reset request
export const reviewResetRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminComment } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be Approved or Rejected.' });
    }

    const resetRequest = await PasswordReset.findById(id);
    if (!resetRequest) {
      return res.status(404).json({ message: 'Reset request not found.' });
    }

    if (resetRequest.status !== 'Pending') {
      return res.status(400).json({ message: 'This request has already been processed.' });
    }

    if (status === 'Rejected') {
      resetRequest.status = 'Rejected';
      resetRequest.adminComment = adminComment || 'Request rejected by administrator.';
      await resetRequest.save();

      return res.status(200).json({ message: 'Reset request rejected successfully.' });
    }

    // Processing 'Approved' status
    const organizerUser = await User.findOne({ email: resetRequest.organiserEmail, role: { $in: ['Organizer', 'organiser'] } });

    if (!organizerUser) {
      return res.status(404).json({ message: `No Organiser found with the email ${resetRequest.organiserEmail}.` });
    }

    // Generate new secure password
    const plainPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    organizerUser.password = hashedPassword;
    await organizerUser.save();

    // Update the request document
    resetRequest.status = 'Approved';
    resetRequest.adminComment = adminComment || 'Password reset artificially and generated.';
    await resetRequest.save();

    res.status(200).json({
      message: 'Password reset completely successful.',
      credentials: {
        loginEmail: organizerUser.email,
        plainPassword: plainPassword
      }
    });
  } catch (error) {
    console.log('review reset request error:', error.message);
    res.status(500).json({ message: 'server error while reviewing reset request' });
  }
};
