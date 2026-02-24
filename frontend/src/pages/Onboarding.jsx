import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

function Onboarding() {
    const { user, login } = useContext(AuthContext);
    const navigate = useNavigate();

    const [interests, setInterests] = useState([]);
    const [followedClubs, setFollowedClubs] = useState([]);
    const [organizers, setOrganizers] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const availableInterests = ['Technical', 'Cultural', 'Sports', 'Other'];

    useEffect(() => {
        // If not a participant, or no user, skip onboarding
        if (!user || user.role !== 'Participant') {
            navigate('/dashboard');
            return;
        }

        const fetchOrganizers = async () => {
            try {
                const res = await api.get('/users/active-organizers');
                setOrganizers(res.data.organizers || []);
            } catch (err) {
                console.error('failed to fetch organizers', err);
                setError('Failed to load clubs. You can continue anyway.');
            } finally {
                setLoading(false);
            }
        };

        fetchOrganizers();
    }, [user, navigate]);

    const handleInterestToggle = (interest) => {
        setInterests(prev =>
            prev.includes(interest)
                ? prev.filter(i => i !== interest)
                : [...prev, interest]
        );
    };

    const handleClubToggle = (clubId) => {
        setFollowedClubs(prev =>
            prev.includes(clubId)
                ? prev.filter(id => id !== clubId)
                : [...prev, clubId]
        );
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            const res = await api.put('/users/profile', {
                interests,
                followedClubs
            });
            // update local user context with the new data
            login(res.data.user);
            navigate('/dashboard');
        } catch (err) {
            console.error('saving preferences failed', err);
            setError('Failed to save preferences. Please try again.');
            setSaving(false);
        }
    };

    const handleSkip = () => {
        navigate('/dashboard');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
            <div className="max-w-2xl w-full bg-white p-8 rounded-xl shadow-lg border border-gray-100">

                <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Welcome to Felicity! 🎉</h2>
                    <p className="text-gray-600">Let's personalize your experience. What are you interested in?</p>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-md text-sm border border-red-100">
                        {error}
                    </div>
                )}

                {/* Categories Section */}
                <div className="mb-10">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Select Your Interests</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {availableInterests.map((interest) => (
                            <label
                                key={interest}
                                className={`flex items-center justify-center px-4 py-3 border rounded-lg cursor-pointer transition-all duration-200 
                  ${interests.includes(interest)
                                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-medium shadow-sm'
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                            >
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={interests.includes(interest)}
                                    onChange={() => handleInterestToggle(interest)}
                                />
                                <span>{interest}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Clubs Section */}
                <div className="mb-10">
                    <div className="flex justify-between items-end mb-4 border-b pb-2">
                        <h3 className="text-lg font-semibold text-gray-800">Follow Clubs & Organisers</h3>
                        <span className="text-sm text-gray-500">{followedClubs.length} selected</span>
                    </div>

                    {organizers.length === 0 ? (
                        <p className="text-gray-500 italic text-center py-4 bg-gray-50 rounded-lg">No active clubs found at the moment.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {organizers.map((org) => (
                                <div
                                    key={org._id}
                                    onClick={() => handleClubToggle(org._id)}
                                    className={`flex flex-col p-4 border rounded-lg cursor-pointer transition-all duration-200
                    ${followedClubs.includes(org._id)
                                            ? 'bg-blue-50 border-blue-400 shadow-sm'
                                            : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className={`font-semibold ${followedClubs.includes(org._id) ? 'text-blue-800' : 'text-gray-800'}`}>
                                            {org.organizerName || org.name}
                                        </h4>
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mt-1 cursor-pointer"
                                            checked={followedClubs.includes(org._id)}
                                            readOnly
                                        />
                                    </div>
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{org.category}</span>
                                    <p className="text-sm text-gray-600 line-clamp-2">{org.description || 'No description provided.'}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-100">
                    <button
                        onClick={handleSkip}
                        disabled={saving}
                        className="w-full sm:w-1/3 px-4 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                    >
                        Skip for Now
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || (interests.length === 0 && followedClubs.length === 0)}
                        className="w-full sm:w-2/3 flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
                    >
                        {saving ? 'Saving...' : 'Save Preferences & Continue'}
                    </button>
                </div>

            </div>
        </div>
    );
}

export default Onboarding;
