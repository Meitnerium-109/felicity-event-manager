import jwt from 'jsonwebtoken';

export const generateToken = (res, userId, role) => {
  try {
    // creating jwt token with user id and role
    const token = jwt.sign({ userId, role }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    // setting the token in httponly cookie so it's secure
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
    });

    return token;
  } catch (error) {
    console.log('error generating token:', error.message);
    throw error;
  }
};
