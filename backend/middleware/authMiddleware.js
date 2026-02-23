import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

// middleware to protect routes and verify jwt token
export const protect = async (req, res, next) => {
  try {
    // getting token from cookies
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: 'no token found, unauthorized' });
    }

    // verifying the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // finding the user without the password
    req.user = await User.findById(decoded.userId).select('-password');

    if (!req.user) {
      return res.status(404).json({ message: 'user not found' });
    }

    next();
  } catch (error) {
    console.log('auth middleware error:', error.message);
    return res.status(401).json({ message: 'token is invalid or expired' });
  }
};

// middleware to check if user has the required role
export const authorizeRoles = (roles) => {
  return (req, res, next) => {
    try {
      // checking if the user's role is included in the allowed roles
      if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({
          message: 'you dont have permission to access this resource',
        });
      }
      next();
    } catch (error) {
      console.log('authorize roles error:', error.message);
      return res.status(500).json({ message: 'server error' });
    }
  };
};
