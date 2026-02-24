import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const OrganiserDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, login } = useContext(AuthContext);

    const [organiser, setOrganiser] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const userFollowedIds = user?.followedClubs || [];
    const isFollowing = userFollowedIds.includes(id);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/users/organisers/${id}`);
                setOrganiser(response.data.organiser);
                setEvents(response.data.events || []);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load organiser details.');
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [id]);

    const handleFollowToggle = async () => {
        let updatedFollowedClubs = [];
        if (isFollowing) {
            updatedFollowedClubs = userFollowedIds.filter(fId => fId !== id);
        } else {
            updatedFollowedClubs = [...userFollowedIds, id];
        }

        try {
            const response = await api.put('/users/profile', { followedClubs: updatedFollowedClubs });
            if (response.data.user) {
                login(response.data.user, localStorage.getItem('token'));
            }
        } catch (err) {
            alert('Failed to update follow status.');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-32 min-h-screen bg-gray-50">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error || !organiser) {
        return (
            <div className="min-h-screen bg-gray-50 p-8 flex flex-col justify-center items-center pt-20">
                <div className="bg-red-50 text-red-700 p-6 rounded-lg max-w-lg w-full text-center border border-red-200">
                    <h3 className="font-bold text-lg mb-2">Error Loading Profile</h3>
                    <p>{error || 'Organiser not found.'}</p>
                </div>
                <button onClick={() => navigate('/organisers')} className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700 transition font-bold">
                    Back to Organisers
                </button>
            </div>
        );
    }

    const now = new Date();
    const upcomingEvents = events.filter(e => new Date(e.endDate || e.startDate || e.date) >= now && e.status !== 'Closed' && e.status !== 'Completed');
    const pastEvents = events.filter(e => new Date(e.endDate || e.startDate || e.date) < now || e.status === 'Closed' || e.status === 'Completed');

    const displayName = organiser.organizerName || organiser.name || 'Anonymous Club';

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Organiser Header Profile */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 relative">
                    <div className="h-48 bg-gradient-to-r from-indigo-500 to-purple-700 relative">
                        {/* Decorative Background Elements */}
                        <div className="absolute top-0 right-0 p-8 opacity-20">
                            <svg className="w-32 h-32 text-indigo-100" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
                        </div>
                    </div>

                    <div className="px-8 pb-10 relative">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end -mt-16 mb-6">
                            <div className="flex items-end gap-6">
                                <div className="w-32 h-32 bg-white rounded-2xl shadow-xl p-2 border-4 border-white flex justify-center items-center bg-gradient-to-br from-gray-50 to-gray-200 z-10">
                                    <span className="text-5xl font-black text-indigo-700">{displayName.charAt(0).toUpperCase()}</span>
                                </div>
                                <div className="mb-2 z-10">
                                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">{displayName}</h1>
                                    <div className="flex gap-2 mt-2">
                                        <span className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-purple-200">
                                            {organiser.category || 'General'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleFollowToggle}
                                className={`mt-6 md:mt-0 px-8 py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2 z-10
                                    ${isFollowing
                                        ? 'bg-white border-2 border-indigo-200 text-indigo-700 hover:bg-red-50 hover:border-red-200 hover:text-red-700'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg'
                                    }`
                                }
                            >
                                {isFollowing ? 'Following' : 'Follow This Organiser'}
                            </button>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8 pt-4 border-t border-gray-100 mt-4">
                            <div className="md:col-span-2 space-y-4">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    About {displayName}
                                </h3>
                                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                                    {organiser.description || 'Welcome to our page! Follow us to stay updated on our latest events and announcements.'}
                                </p>
                            </div>

                            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">Contact Info</h3>
                                <div className="space-y-4 text-sm text-gray-700">
                                    {organiser.email && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                            </div>
                                            <a href={`mailto:${organiser.email}`} className="hover:text-indigo-600 font-medium">{organiser.email}</a>
                                        </div>
                                    )}
                                    {organiser.contactNumber ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                                            </div>
                                            <span className="font-medium">{organiser.contactNumber}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                            </div>
                                            <span className="text-gray-400 italic">No phone provided</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Events Section */}
                <div className="mt-12">
                    {/* Upcoming Events */}
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                            <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            Upcoming Events ({upcomingEvents.length})
                        </h2>
                        {upcomingEvents.length === 0 ? (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                                <p className="text-gray-500 font-medium">No upcoming events are currently planned.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {upcomingEvents.map(event => (
                                    <div key={event._id} onClick={() => navigate(`/events/${event._id}`)} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all cursor-pointer group flex flex-col h-full">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">{event.eventName || event.title}</h3>
                                            <span className="bg-green-50 text-green-700 text-xs font-bold px-2 py-1 rounded border border-green-100 uppercase uppercase tracking-wider">Active</span>
                                        </div>
                                        <p className="text-sm text-gray-500 line-clamp-3 mb-4 flex-grow">{event.eventDescription || event.description}</p>
                                        <div className="flex items-center text-sm font-semibold text-gray-600 border-t border-gray-50 pt-4 mt-auto">
                                            <svg className="w-4 h-4 mr-2 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                            {new Date(event.startDate || event.date).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Past Events */}
                    {pastEvents.length > 0 && (
                        <div>
                            <h2 className="text-xl font-bold text-gray-600 mb-6 border-t border-gray-200 pt-8 flex items-center">
                                <svg className="w-6 h-6 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                Past Events
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {pastEvents.map(event => (
                                    <div key={event._id} onClick={() => navigate(`/events/${event._id}`)} className="bg-gray-50 opacity-75 rounded-xl shadow-sm border border-gray-100 p-6 hover:opacity-100 hover:shadow-md transition-all cursor-pointer group flex flex-col h-full">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-lg font-bold text-gray-700 line-clamp-2">{event.eventName || event.title}</h3>
                                            <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">Past</span>
                                        </div>
                                        <div className="flex items-center text-sm font-semibold text-gray-500 border-t border-gray-200 pt-4 mt-auto">
                                            {new Date(event.startDate || event.date).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default OrganiserDetail;
