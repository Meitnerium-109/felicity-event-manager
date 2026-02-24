import mongoose from 'mongoose';

const passwordResetSchema = new mongoose.Schema({
    organiserEmail: {
        type: String,
        required: true,
    },
    clubName: {
        type: String,
        required: true,
    },
    reason: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending',
    },
    adminComment: {
        type: String,
    },
}, { timestamps: true });

export const PasswordReset = mongoose.model('PasswordReset', passwordResetSchema);
