import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';

// load env vars
dotenv.config();

const seedAdmin = async () => {
  try {
    // connecting to the database
    await connectDB();

    // checking if admin already exists
    const adminExists = await User.findOne({ role: 'Admin' });
    if (adminExists) {
      console.log('✓ admin user already exists');
      process.exit(0);
    }

    // seeding admin directly into the database as per instructions
    const adminPassword = await bcrypt.hash('admin@123', 10);
    const admin = new User({
      email: 'admin@felicity.iiit.ac.in',
      password: adminPassword,
      role: 'Admin',
      name: 'Felicity Admin',
    });

    await admin.save();
    console.log('✓ admin user created successfully');
    process.exit(0);
  } catch (error) {
    console.log('✗ error seeding admin:', error.message);
    process.exit(1);
  }
};

seedAdmin();
