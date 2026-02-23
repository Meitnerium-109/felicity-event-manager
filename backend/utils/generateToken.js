import jwt from 'jsonwebtoken';

export const generateToken = (res, userId, role) => {
  try {
    // creating jwt token with user id and role
    const token = jwt.sign({ userId, role }, process.env.JWT_SECRET || 'supersecretkey', {
      expiresIn: '30d',
    });

    // setting the token in httponly cookie so it is secure
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Changed from 'strict' to 'lax' to allow local cross-port cookies
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
    });

    return token;
  } catch (error) {
    console.log('error generating token:', error.message);
    throw error;
  }
};