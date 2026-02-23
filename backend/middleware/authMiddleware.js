import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'no token found, unauthorised' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey');
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

export const authorizeRoles = (roles) => {
  return (req, res, next) => {
    try {
      const userRole = req.user?.role?.toLowerCase();
      const normalisedRoles = roles.map(role => role.toLowerCase());
      
      if (!req.user || !normalisedRoles.includes(userRole)) {
        return res.status(403).json({
          message: 'you do not have permission to access this resource',
        });
      }
      next();
    } catch (error) {
      console.log('authorise roles error:', error.message);
      return res.status(500).json({ message: 'server error' });
    }
  };
};