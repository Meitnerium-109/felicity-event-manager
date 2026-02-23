import bcrypt from 'bcrypt';
import { User } from '../models/User.js';

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
    const { name, category, collegeName, contactNumber, description, contactEmail } = req.body;

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
