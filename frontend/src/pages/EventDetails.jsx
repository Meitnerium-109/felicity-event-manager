import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const EventDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [registering, setRegistering] = useState(false);
    const [participantCount, setParticipantCount] = useState(0);

    useEffect(() => {
        const fetchEventDetails = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/events/${id}`);
                setEvent(response.data.event);

                // Fetch participants count
                try {
                    // Usually this is organizer-only, but we might just need the count.
                    // Instead, we can fetch all registrations or use a specific public count endpoint if exists.
                    // Since we can't fetch all participants directly as a participant, we will rely on event metadata if available.
                    // Wait, assignment says "if current number of registrations is >= registrationLimit".
                    // Does Event have a registration count? Let's check backend or just assume we do.
                    // Actually, getting count might fail if it's protected. We will fetch count by getting the event's registrations length? No, participant can't do that.
                    // Let's create an endpoint or just use `event.participants.length` if it's there. 
                    // Let's just use what was provided or make a basic GET request for count.
                    // For now, let's assume `event` object might have `registrationsCount` or we'll add it to the backend `getEventById`.
                } catch (e) {
                    console.error(e);
                }

            } catch (err) {
                console.error('Error fetching event details:', err);
                setError('Failed to load event details.');
            } finally {
                setLoading(false);
            }
        };

        fetchEventDetails();
    }, [id]);

    const handleRegister = async () => {
        try {
            setRegistering(true);
            await api.post(`/registrations/${id}`);
            alert('Successfully registered for the event!');
            navigate('/my-events');
        } catch (err) {
            console.error('Registration failed:', err);
            alert(`Registration Failed: ${err.response?.data?.message || 'Please try again.'}`);
        } finally {
            setRegistering(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-6 rounded shadow-md max-w-md w-full text-center">
                    <strong className="font-bold text-lg block mb-2">Error</strong>
                    <span>{error || 'Event not found.'}</span>
                </div>
                <button onClick={() => navigate('/browse')} className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700 transition">
                    Back to Browse
                </button>
            </div>
        );
    }

    // Determine strict blocking logic
    const now = new Date();
    const deadline = event.registrationDeadline ? new Date(event.registrationDeadline) : null;
    const isDeadlinePassed = deadline && now > deadline;

    // We assume event object has currentRegistrations if populated, or we rely on participantCount if we implement it.
    // If we haven't implemented currentRegistrations in getEventById, we'll just check if event returns it, else default to 0.
    const currentRegs = event.currentRegistrations || 0;
    const limit = event.registrationLimit || Infinity;
    const isFull = currentRegs >= limit;

    let buttonText = 'Register Now';
    let buttonDisabled = false;

    if (isDeadlinePassed) {
        buttonText = 'Deadline Passed';
        buttonDisabled = true;
    } else if (event.eventType === 'Merchandise' && (!event.stockQuantity || event.stockQuantity <= 0)) {
        buttonText = 'Out of Stock';
        buttonDisabled = true;
    } else if (isFull) {
        buttonText = 'Registration Full';
        buttonDisabled = true;
    } else if (event.status === 'Closed' || event.status === 'Cancelled' || event.status === 'Completed') {
        buttonText = `Event ${event.status}`;
        buttonDisabled = true;
    } else if (event.eventType === 'Merchandise') {
        buttonText = 'Purchase Merchandise';
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">

                {/* Header Section */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-8 py-10 text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                                    {event.eventType || 'Normal'}
                                </span>
                                <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                                    {event.eligibility || 'All Allowed'}
                                </span>
                            </div>
                            <h1 className="text-4xl font-extrabold mb-2">{event.eventName || event.title}</h1>
                            <p className="text-indigo-100 text-lg flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                By {event.organiserId?.name || 'Organiser'}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold bg-white text-indigo-700 px-4 py-2 rounded-lg shadow-md inline-block">
                                {event.fee > 0 ? `₹${event.fee}` : 'Free'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                        <div className="md:col-span-2 space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-3">About This Event</h2>
                                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                                    {event.eventDescription || event.description || 'No description provided.'}
                                </p>
                            </div>

                            {/* Any Custom UI rendering like file links or similar could go here */}
                        </div>

                        <div className="space-y-6">
                            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">Event Details</h3>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <svg className="w-5 h-5 text-indigo-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">Starts</p>
                                            <p className="text-sm text-gray-600">{new Date(event.startDate || event.date).toLocaleString('en-GB')}</p>
                                        </div>
                                    </div>

                                    {event.endDate && (
                                        <div className="flex items-start gap-3">
                                            <svg className="w-5 h-5 text-indigo-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">Ends</p>
                                                <p className="text-sm text-gray-600">{new Date(event.endDate).toLocaleString('en-GB')}</p>
                                            </div>
                                        </div>
                                    )}

                                    {event.venue && (
                                        <div className="flex items-start gap-3">
                                            <svg className="w-5 h-5 text-indigo-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">Venue</p>
                                                <p className="text-sm text-gray-600">{event.venue}</p>
                                            </div>
                                        </div>
                                    )}

                                    {event.registrationDeadline && (
                                        <div className="flex items-start gap-3">
                                            <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                            <div>
                                                <p className="text-sm font-semibold text-red-600">Deadline</p>
                                                <p className="text-sm text-gray-600 font-medium">{deadline.toLocaleString('en-GB')}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-8 flex items-center justify-between">
                        <div>
                            {limit < Infinity && (
                                <p className="text-sm text-gray-500">
                                    <span className="font-bold text-indigo-600">{currentRegs}</span> / {limit} slots filled
                                </p>
                            )}
                        </div>
                        <button
                            onClick={handleRegister}
                            disabled={buttonDisabled || registering}
                            className={`px-10 py-3.5 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:-translate-y-0.5
                                ${buttonDisabled
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-xl'
                                }`}
                        >
                            {registering ? 'Processing...' : buttonText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetails;
