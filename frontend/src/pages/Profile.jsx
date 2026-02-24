import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const Profile = () => {
    const { user, login } = useContext(AuthContext); // login acts as setUser
    const navigate = useNavigate();

    // Profile Form State
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        contactNumber: '',
        collegeName: '',
    });

    // Array states
    const [interests, setInterests] = useState([]);
    const [followedClubs, setFollowedClubs] = useState([]);

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
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                contactNumber: user.contactNumber || '',
                collegeName: user.collegeName || '',
            });
            setInterests(user.interests || []);

            // We need to fetch full clubs info if it's just ObjectIDs, but for now we'll fetch from API
            // Actually, since user object might just have arrays of IDs, let's fetch actual clubs
            fetchFollowedClubs(user.followedClubs || []);
        }
    }, [user]);

    const fetchFollowedClubs = async (clubIds) => {
        if (!clubIds || clubIds.length === 0) {
            setFollowedClubs([]);
            return;
        }
        try {
            // We will fetch all active organisers and filter by IDs, or call a specific route if exists.
            // As we just built `/api/users/organisers`, we can use that to match names!
            const response = await api.get('/users/organisers');
            const activeClubs = response.data.organisers;
            const myClubs = activeClubs.filter(club => clubIds.includes(club._id));
            setFollowedClubs(myClubs);
        } catch (err) {
            console.error('Failed to fetch followed clubs details', err);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleInterestToggle = (interest) => {
        setInterests(prev => {
            if (prev.includes(interest)) {
                return prev.filter(i => i !== interest);
            } else {
                return [...prev, interest];
            }
        });
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            const payload = {
                ...formData,
                interests,
                // we map full objects back to IDs just in case, though usually handled via separate follow unfollow
                followedClubs: followedClubs.map(c => c._id)
            };

            const response = await api.put('/users/profile', payload);
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

    const handleUnfollow = async (clubId) => {
        try {
            // Unfollowing means removing the ID from the user object and calling PUT
            const updatedClubIds = followedClubs.filter(c => c._id !== clubId).map(c => c._id);

            const payload = { ...formData, interests, followedClubs: updatedClubIds };
            const response = await api.put('/users/profile', payload);

            // Update local state and context
            setFollowedClubs(prev => prev.filter(c => c._id !== clubId));
            if (response.data.user) {
                login(response.data.user, localStorage.getItem('token'));
            }
        } catch (err) {
            alert('Failed to unfollow club.');
        }
    };

    const availableInterests = ['Technical', 'Cultural', 'Sports', 'Social', 'Academic'];

    if (!user) return <div className="p-8 text-center text-gray-500">Loading profile data...</div>;

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Manage Your Profile</h1>
                    <p className="mt-2 text-sm text-gray-600">Update your personal details, preferences, and security settings.</p>
                </div>

                <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3">
                        {/* Visual Avatar / Readonly details */}
                        <div className="bg-indigo-50 p-8 border-b md:border-b-0 md:border-r border-gray-200 flex flex-col items-center justify-center text-center">
                            <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-md">
                                {user.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">{user.name || 'User'}</h2>

                            <div className="mt-6 w-full space-y-4">
                                <div className="text-left">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        value={user.email}
                                        disabled
                                        className="block w-full px-3 py-2 bg-gray-100 border border-transparent rounded-md text-sm text-gray-600 cursor-not-allowed"
                                    />
                                </div>
                                <div className="text-left">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Participant Type</label>
                                    <input
                                        type="text"
                                        value={user.participantType || 'N/A'}
                                        disabled
                                        className="block w-full px-3 py-2 bg-gray-100 border border-transparent rounded-md text-sm text-gray-600 font-bold uppercase cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Editable Profile Form */}
                        <div className="col-span-2 p-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 border-b pb-2">Personal Information</h3>

                            {message && <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-md border border-green-200">{message}</div>}
                            {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">{error}</div>}

                            <form onSubmit={handleProfileSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                                        <input
                                            type="text"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleInputChange}
                                            required
                                            className="block w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                                        <input
                                            type="text"
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleInputChange}
                                            className="block w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">College Name</label>
                                        <input
                                            type="text"
                                            name="collegeName"
                                            value={formData.collegeName}
                                            onChange={handleInputChange}
                                            className="block w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <label className="block text-sm font-bold text-gray-900 mb-3">Your Interests</label>
                                    <p className="text-xs text-gray-500 mb-4">Select categories to influence your event recommendations.</p>
                                    <div className="flex flex-wrap gap-3">
                                        {availableInterests.map(interest => (
                                            <label
                                                key={interest}
                                                className={`flex items-center px-4 py-2 rounded-full border cursor-pointer transition-colors text-sm font-medium
                                            ${interests.includes(interest) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'}`
                                                }
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="sr-only"
                                                    checked={interests.includes(interest)}
                                                    onChange={() => handleInterestToggle(interest)}
                                                />
                                                {interest}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-6">
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

                {/* Extended Settings Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Followed Clubs */}
                    <div className="bg-white shadow rounded-lg p-8 border border-gray-200 self-start">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-pink-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path></svg>
                            Clubs You Follow
                        </h3>
                        {followedClubs.length === 0 ? (
                            <div className="text-gray-500 text-sm text-center py-6 bg-gray-50 rounded-md border border-gray-100">
                                You aren't following any clubs yet.<br />
                                <button onClick={() => navigate('/organisers')} className="text-indigo-600 font-semibold mt-2 hover:underline">Find clubs to follow</button>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100 max-h-64 overflow-y-auto pr-2">
                                {followedClubs.map(club => (
                                    <li key={club._id} className="py-4 flex justify-between items-center group">
                                        <div className="flex items-center cursor-pointer" onClick={() => navigate(`/organisers/${club._id}`)}>
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-800 font-bold flex items-center justify-center mr-3 uppercase text-sm border border-indigo-200 group-hover:shadow-md transition-shadow">
                                                {(club.organizerName || club.name || 'C').charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{club.organizerName || club.name}</p>
                                                <p className="text-xs text-gray-500 font-semibold">{club.category}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleUnfollow(club._id)}
                                            className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 px-3 py-1.5 rounded-full transition-colors"
                                        >
                                            Unfollow
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Change Password */}
                    <div className="bg-white shadow rounded-lg p-8 border border-gray-200 self-start">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                            Security
                        </h3>

                        {passMessage && <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-md border border-green-200">{passMessage}</div>}
                        {passError && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">{passError}</div>}

                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                <input
                                    type="password"
                                    name="currentPassword"
                                    value={passwords.currentPassword}
                                    onChange={handlePasswordChange}
                                    required
                                    className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                                    className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                                    className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
        </div>
    );
};

export default Profile;
