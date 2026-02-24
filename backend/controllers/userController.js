import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { Event } from '../models/Event.js';

// update user profile
export const updateProfile = async (req, res) => {
    try {
        const {
            firstName, lastName, contactNumber, collegeName, interests, followedClubs,
            organizerName, contactEmail, category, description, discordWebhookUrl, name
        } = req.body;

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Participant fields
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (firstName || lastName) user.name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        if (interests) user.interests = interests;
        if (followedClubs) user.followedClubs = followedClubs;

        // Shared/Organiser fields
        if (name) user.name = name;
        if (contactNumber) user.contactNumber = contactNumber;
        if (collegeName) user.collegeName = collegeName;
        if (organizerName) user.organizerName = organizerName;
        if (contactEmail) user.contactEmail = contactEmail;
        if (category) user.category = category;
        if (description) user.description = description;
        if (discordWebhookUrl !== undefined) user.discordWebhookUrl = discordWebhookUrl;

        await user.save();

        res.status(200).json({
            message: 'Profile updated successfully',
            user: {
                _id: user._id,
                email: user.email,
                name: user.name,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                participantType: user.participantType,
                contactNumber: user.contactNumber,
                collegeName: user.collegeName,
                interests: user.interests,
                followedClubs: user.followedClubs,
                organizerName: user.organizerName,
                contactEmail: user.contactEmail,
                category: user.category,
                description: user.description,
                discordWebhookUrl: user.discordWebhookUrl
            }
        });
    } catch (error) {
        console.log('Update profile error:', error.message);
        res.status(500).json({ message: 'Server error while updating profile' });
    }
};

// change password
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect current password' });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedNewPassword;

        await user.save();

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        console.log('Change password error:', error.message);
        res.status(500).json({ message: 'Server error while changing password' });
    }
};

// get active organizers
export const getAllActiveOrganisers = async (req, res) => {
    try {
        const organisers = await User.find({
            role: { $in: ['Organizer', 'organiser', 'Organiser', 'organizer'] },
            isActive: { $ne: false }
        }).select('_id organizerName name category description');

        res.status(200).json({
            message: 'Active organisers fetched successfully',
            organisers
        });
    } catch (error) {
        console.log('Get active organisers error:', error.message);
        res.status(500).json({ message: 'Server error while fetching organisers' });
    }
};

// get public organiser profile and their events
export const getOrganiserPublicProfile = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Fetch Organiser Profile
        const organiser = await User.findOne({
            _id: id,
            role: { $in: ['Organizer', 'organiser', 'Organiser', 'organizer'] }
        }).select('_id organizerName name category description email contactNumber');

        if (!organiser) {
            return res.status(404).json({ message: 'Organiser not found' });
        }

        // 2. Fetch Organiser's Events (Published, Ongoing, Completed, Closed)
        const events = await Event.find({
            organiserId: id,
            status: { $in: ['Published', 'Ongoing', 'Completed', 'Closed'] }
        }).sort({ startDate: 1 });

        res.status(200).json({
            message: 'Organiser profile fetched successfully',
            organiser,
            events
        });

    } catch (error) {
        console.log('Get public organiser profile error:', error.message);
        res.status(500).json({ message: 'Server error while fetching organiser profile' });
    }
};
