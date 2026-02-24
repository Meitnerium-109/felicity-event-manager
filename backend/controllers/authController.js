import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET || 'supersecretkey', {
    expiresIn: '30d',
  });
};

export const registerParticipant = async (req, res) => {
  try {
    const { firstName, lastName, email, password, participantType, contactNumber, collegeName } = req.body;

    if (participantType === 'IIIT') {
      const iiitRegex = /@(iiit\.ac\.in|research\.iiit\.ac\.in|students\.iiit\.ac\.in)$/;
      if (!iiitRegex.test(email)) {
        return res.status(400).json({ message: 'IIIT participants must use an official @iiit.ac.in, @research.iiit.ac.in, or @students.iiit.ac.in email address.' });
      }
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name: `${firstName} ${lastName}`, // preserving the original required 'name' field
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: 'Participant', // Force role to Participant under all circumstances
      participantType,
      contactNumber,
      collegeName: participantType === 'IIIT' ? 'IIIT Hyderabad' : collegeName
    });

    await user.save();

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      message: 'User registered successfully',
      token, // Send token in the JSON body
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.log('Register error:', error.message);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: 'Account disabled by Admin. Please contact support.' });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      message: 'Logged in successfully',
      token, // Send token in the JSON body
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    });
  } catch (error) {
    console.log('Login error:', error.message);
    res.status(500).json({ message: 'Server error during login' });
  }
};

export const logout = async (req, res) => {
  try {
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.log('Logout error:', error.message);
    res.status(500).json({ message: 'Server error during logout' });
  }
};