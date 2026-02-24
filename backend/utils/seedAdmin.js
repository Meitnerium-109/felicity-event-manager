import bcrypt from 'bcrypt';
import { User } from '../models/User.js';

export const seedAdmin = async () => {
    try {
        const adminExists = await User.findOne({ role: { $in: ['Admin', 'admin'] } });
        if (!adminExists) {
            const adminEmail = process.env.ADMIN_EMAIL || 'admin@felicity.iiit.ac.in';
            const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
            const hashedPassword = await bcrypt.hash(adminPassword, 10);

            const adminUser = new User({
                name: 'System Admin',
                email: adminEmail,
                password: hashedPassword,
                role: 'Admin'
            });

            await adminUser.save();
            console.log('Admin user seeded successfully with email:', adminEmail);
        } else {
            console.log('Admin user already exists in the database.');
        }
    } catch (error) {
        console.error('Error seeding admin user:', error);
    }
};
