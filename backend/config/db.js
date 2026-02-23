import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    // connecting to db here
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ MongoDB connected successfully');
    return conn;
  } catch (error) {
    console.log('✗ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};
