import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const OrganizerProfile = () => {
    const { user, login } = useContext(AuthContext); // login acts as setUser
    const navigate = useNavigate();

    // Profile Form State
    const [formData, setFormData] = useState({
        organizerName: '',
        category: '',
        description: '',
        contactEmail: '',
        contactNumber: '',
        discordWebhookUrl: '',
        name: '' // General full name
    });

    // UI States
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // Password Form State
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });
    const [passMessage, setPassMessage] = useState('');
    const [passError, setPassError] = useState('');
    const [passLoading, setPassLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                organizerName: user.organizerName || user.name || '',
                name: user.name || '',
                category: user.category || 'Other',
                description: user.description || '',
                contactEmail: user.contactEmail || user.email || '',
                contactNumber: user.contactNumber || '',
                discordWebhookUrl: user.discordWebhookUrl || '',
            });
        }
    }, [user]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            const response = await api.put('/users/profile', formData);
            setMessage(response.data.message || 'Profile updated successfully!');
            if (response.data.user) {
                login(response.data.user, localStorage.getItem('token')); // refresh context user
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswords((prev) => ({ ...prev, [name]: value }));
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPassError('');
        setPassMessage('');

        if (passwords.newPassword !== passwords.confirmNewPassword) {
            setPassError('New passwords do not match!');
            return;
        }
        if (passwords.newPassword.length < 6) {
            setPassError('New password must be at least 6 characters long.');
            return;
        }

        setPassLoading(true);

        try {
            const response = await api.put('/users/change-password', {
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword
            });
            setPassMessage(response.data.message || 'Password changed successfully!');
            setPasswords({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
        } catch (err) {
            setPassError(err.response?.data?.message || 'Failed to change password.');
        } finally {
            setPassLoading(false);
        }
    };

    if (!user) return <div className="p-8 text-center text-gray-500">Loading profile data...</div>;

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Organiser Profile</h1>
                    <p className="mt-2 text-sm text-gray-600">Update your club details, contact info, and integrations.</p>
                </div>

                <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3">
                        {/* Visual Avatar / Readonly details */}
                        <div className="bg-indigo-50 p-8 border-b md:border-b-0 md:border-r border-gray-200 flex flex-col items-center justify-center text-center">
                            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-4xl font-black shadow-md mb-4 border-2 border-indigo-200">
                                {(formData.organizerName || 'O').charAt(0).toUpperCase()}
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">{formData.organizerName || 'Organiser'}</h2>

                            <div className="mt-6 w-full space-y-4">
                                <div className="text-left">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Login Email</label>
                                    <input
                                        type="email"
                                        value={user.email}
                                        disabled
                                        className="block w-full px-3 py-2 bg-gray-100 border border-transparent rounded-md text-sm text-gray-600 cursor-not-allowed"
                                        title="Your main login email cannot be changed here."
                                    />
                                </div>
                                <div className="text-left">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Account Role</label>
                                    <input
                                        type="text"
                                        value={user.role || 'N/A'}
                                        disabled
                                        className="block w-full px-3 py-2 bg-indigo-100 border border-transparent rounded-md text-sm text-indigo-700 font-bold uppercase cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Editable Profile Form */}
                        <div className="col-span-2 p-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 border-b pb-2">Public Information</h3>

                            {message && <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-md border border-green-200">{message}</div>}
                            {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">{error}</div>}

                            <form onSubmit={handleProfileSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Club / Organiser Name</label>
                                        <input
                                            type="text"
                                            name="organizerName"
                                            value={formData.organizerName}
                                            onChange={handleInputChange}
                                            required
                                            className="block w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                                        <select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleInputChange}
                                            className="block w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        >
                                            <option value="Technical">Technical</option>
                                            <option value="Cultural">Cultural</option>
                                            <option value="Sports">Sports</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Public Description</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows="3"
                                        className="block w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="Describe your club to the participants..."
                                    ></textarea>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Public Contact Email</label>
                                        <input
                                            type="email"
                                            name="contactEmail"
                                            value={formData.contactEmail}
                                            onChange={handleInputChange}
                                            className="block w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                                        <input
                                            type="tel"
                                            name="contactNumber"
                                            value={formData.contactNumber}
                                            onChange={handleInputChange}
                                            className="block w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <label className="block text-sm font-bold text-gray-900 mb-1 flex items-center gap-2">
                                        Discord Webhook URL
                                        <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded font-black uppercase">Auto-Post</span>
                                    </label>
                                    <p className="text-xs text-gray-500 mb-3">If provided, published events will be automatically announced to your Discord server.</p>
                                    <input
                                        type="url"
                                        name="discordWebhookUrl"
                                        value={formData.discordWebhookUrl}
                                        onChange={handleInputChange}
                                        placeholder="https://discord.com/api/webhooks/..."
                                        className="block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-600 font-mono"
                                    />
                                </div>

                                <div className="pt-6 border-t border-gray-100">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
                                    >
                                        {loading ? 'Saving Changes...' : 'Save Profile Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Change Password */}
                <div className="bg-white shadow rounded-lg p-8 border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                        Security Settings
                    </h3>

                    {passMessage && <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-md border border-green-200">{passMessage}</div>}
                    {passError && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">{passError}</div>}

                    <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                            <input
                                type="password"
                                name="currentPassword"
                                value={passwords.currentPassword}
                                onChange={handlePasswordChange}
                                required
                                className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                            <input
                                type="password"
                                name="newPassword"
                                value={passwords.newPassword}
                                onChange={handlePasswordChange}
                                required
                                minLength={6}
                                className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                            <input
                                type="password"
                                name="confirmNewPassword"
                                value={passwords.confirmNewPassword}
                                onChange={handlePasswordChange}
                                required
                                minLength={6}
                                className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                            />
                        </div>
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={passLoading}
                                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors ${passLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
                            >
                                {passLoading ? 'Updating Password...' : 'Change Password'}
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    );
};

export default OrganizerProfile;
