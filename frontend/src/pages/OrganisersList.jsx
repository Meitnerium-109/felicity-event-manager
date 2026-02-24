import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const OrganisersList = () => {
    const [organisers, setOrganisers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const { user, login } = useContext(AuthContext);
    const navigate = useNavigate();

    // Load the current user's followed clubs to determine boolean toggles
    const userFollowedIds = user?.followedClubs || [];

    useEffect(() => {
        const fetchOrganisers = async () => {
            try {
                setLoading(true);
                const response = await api.get('/users/organisers');
                setOrganisers(response.data.organisers || []);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch organisers.');
            } finally {
                setLoading(false);
            }
        };

        fetchOrganisers();
    }, []);

    const handleFollowToggle = async (e, orgId) => {
        e.stopPropagation(); // Prevent card click navigating

        // Optimistic or standard UI update - let's do a standard PUT to /users/profile
        const isCurrentlyFollowing = userFollowedIds.includes(orgId);
        let updatedFollowedClubs = [];

        if (isCurrentlyFollowing) {
            updatedFollowedClubs = userFollowedIds.filter(id => id !== orgId);
        } else {
            updatedFollowedClubs = [...userFollowedIds, orgId];
        }

        try {
            const payload = { followedClubs: updatedFollowedClubs };
            const response = await api.put('/users/profile', payload);

            // Update auth context so the UI toggles globally
            if (response.data.user) {
                login(response.data.user, localStorage.getItem('token'));
            }
        } catch (err) {
            alert('Failed to update follow status.');
            console.error(err);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-32 min-h-screen bg-gray-50">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-8 flex justify-center items-start pt-20">
                <div className="bg-red-50 text-red-700 p-6 rounded-lg max-w-lg w-full text-center border border-red-200">
                    <h3 className="font-bold text-lg mb-2">Error Loading Organisers</h3>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-10 flex flex-col items-center text-center">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-3">Clubs & Organisers</h1>
                    <p className="text-gray-600 text-lg max-w-2xl">
                        Discover the clubs making it happen. Follow your favourites to get their events straight in your personalized feed!
                    </p>
                </div>

                {organisers.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
                        <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                        </svg>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No active organisers found</h3>
                        <p className="text-gray-500">Check back later when clubs start registering.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {organisers.map((org) => {
                            const isFollowing = userFollowedIds.includes(org._id);
                            const displayName = org.organizerName || org.name || 'Anonymous Club';

                            return (
                                <div
                                    key={org._id}
                                    onClick={() => navigate(`/organisers/${org._id}`)}
                                    className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col overflow-hidden group cursor-pointer"
                                >
                                    {/* Card Top / Banner */}
                                    <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
                                        <div className="absolute -bottom-8 left-6">
                                            <div className="w-16 h-16 bg-white rounded-xl shadow-md p-1 border-2 border-white flex items-center justify-center text-2xl font-black text-indigo-700 bg-gradient-to-br from-gray-50 to-gray-200">
                                                {displayName.charAt(0).toUpperCase()}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Body */}
                                    <div className="pt-10 px-6 pb-6 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                                    {displayName}
                                                </h2>
                                                <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md mt-1 inline-block">
                                                    {org.category || 'General'}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-3 line-clamp-3 leading-relaxed flex-1">
                                            {org.description || 'No description provided by this organiser.'}
                                        </p>
                                    </div>

                                    {/* Card Footer */}
                                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                                        <button
                                            onClick={(e) => handleFollowToggle(e, org._id)}
                                            className={`w-full py-2.5 px-4 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2
                                        ${isFollowing
                                                    ? 'bg-white border-2 border-indigo-200 text-indigo-700 hover:bg-red-50 hover:border-red-200 hover:text-red-700'
                                                    : 'bg-indigo-600 border border-transparent text-white hover:bg-indigo-700 hover:shadow-md'
                                                }`
                                            }
                                        >
                                            {isFollowing ? (
                                                <>
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                                                    Following
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                                    Follow Club
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrganisersList;
