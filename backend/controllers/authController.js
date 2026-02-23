import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';

// regex to validate iiit email format (name@iiit.ac.in)
const iiitEmailRegex = /^[a-z]+\.[a-z]+@iiit\.ac\.in$/i;

// register a participant
export const registerParticipant = async (req, res) => {
  try {
    const { email, password, firstName, lastName, participantType, areasOfInterest } = req.body;

    // checking if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'email already in use' });
    }

    // if participant is from IIIT, validate email format
    if (participantType === 'IIIT') {
      if (!iiitEmailRegex.test(email)) {
        return res
          .status(400)
          .json({ message: 'invalid iiit email format (should be name@iiit.ac.in)' });
      }
    }

    // hashing the password so we don't get in trouble
    const hashedPassword = await bcrypt.hash(password, 10);

    // creating the user
    const user = new User({
      email,
      password: hashedPassword,
      role: 'Participant',
      firstName,
      lastName,
      participantType,
      areasOfInterest: areasOfInterest || [],
    });

    await user.save();

    // generating token and setting cookie
    generateToken(res, user._id, user.role);

    res.status(201).json({
      message: 'participant registered successfully',
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    console.log('register error:', error.message);
    res.status(500).json({ message: 'server error during registration' });
  }
};

// login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // finding the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'invalid email or password' });
    }

    // comparing the entered password with the hashed password
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'invalid email or password' });
    }

    // generating token and setting cookie
    generateToken(res, user._id, user.role);

    res.status(200).json({
      message: 'logged in successfully',
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    console.log('login error:', error.message);
    res.status(500).json({ message: 'server error during login' });
  }
};

// logout user
export const logout = async (req, res) => {
  try {
    // clearing the jwt cookie by setting expiration to a past date
    res.cookie('token', '', {
      httpOnly: true,
      expires: new Date(0),
    });

    res.status(200).json({ message: 'logged out successfully' });
  } catch (error) {
    console.log('logout error:', error.message);
    res.status(500).json({ message: 'server error during logout' });
  }
};
