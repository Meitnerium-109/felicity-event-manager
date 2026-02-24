import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import TicketModal from '../components/TicketModal';

const MyRegistrations = () => {
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('Normal');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await api.get('/registrations/history');
                const data = response.data.registrations || [];
                setRegistrations(data);
            } catch (err) {
                console.error('Error fetching registration history:', err);
                setError(err.response?.data?.message || 'Failed to fetch history.');
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    const handleCancelRegistration = async (registrationId) => {
        if (window.confirm('Are you sure you want to cancel this registration?')) {
            try {
                await api.delete(`/registrations/${registrationId}`);
                setRegistrations((prev) => prev.filter((reg) => reg._id !== registrationId));
            } catch (err) {
                console.error('Error cancelling registration:', err);
                alert(err.response?.data?.message || 'Failed to cancel registration');
            }
        }
    };

    const now = new Date();

    // Upcoming Events: startDate in the future
    const upcomingEvents = registrations.filter(reg => {
        const event = reg.eventId;
        if (!event) return false;
        const d = new Date(event.startDate || event.date);
        return d > now && event.status !== 'Cancelled';
    });

    // History Events: past events or cancelled
    const historyEvents = registrations.filter(reg => {
        const event = reg.eventId;
        if (!event) return false;
        const d = new Date(event.startDate || event.date);
        return d <= now || event.status === 'Cancelled';
    });

    // Filter history events based on the active tab
    const filteredHistory = historyEvents.filter((reg) => {
        const event = reg.eventId;
        const status = event.status || 'Published';
        const isCompleted = status === 'Completed' || status === 'Closed';

        switch (activeTab) {
            case 'Normal':
                return event.eventType === 'Normal' && !isCompleted && status !== 'Cancelled';
            case 'Merchandise':
                return event.eventType === 'Merchandise' && !isCompleted && status !== 'Cancelled';
            case 'Completed':
                return isCompleted;
            case 'Cancelled/Rejected':
                return status === 'Cancelled';
            default:
                return true;
        }
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-6 rounded shadow-md max-w-md w-full" role="alert">
                    <strong className="font-bold text-lg block mb-2">Error Loading History</strong>
                    <span className="block sm:inline">{error}</span>
                </div>
                <button
                    onClick={() => navigate('/browse')}
                    className="mt-6 px-6 py-2 bg-indigo-600 text-white font-medium rounded-md shadow hover:bg-indigo-700 transition"
                >
                    Browse Events
                </button>
            </div>
        );
    }

    const tabs = ['Normal', 'Merchandise', 'Completed', 'Cancelled/Rejected'];

    const renderEventCard = (registration, isUpcoming = false) => {
        const event = registration.eventId;
        const organiser = event.organiserId || {};

        const formattedDate = new Date(event.startDate || event.date).toLocaleString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Determine Team Name (N/A for individual as requested)
        const teamName = registration.teamName || 'N/A';

        return (
            <div
                key={registration._id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition duration-200 border border-gray-100 flex flex-col overflow-hidden"
            >
                <div className="p-6 flex-grow">
                    <div className="flex justify-between items-start mb-3 border-b border-gray-50 pb-3">
                        <h3 className="text-xl font-bold text-gray-900 line-clamp-1" title={event.eventName || event.title}>
                            {event.eventName || event.title}
                        </h3>
                        <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-md ml-3 whitespace-nowrap uppercase tracking-wider">
                            {event.eventType || 'Normal'}
                        </span>
                    </div>

                    <div className="space-y-3 mt-4">
                        <div className="flex text-sm">
                            <span className="text-gray-500 w-24">Organiser:</span>
                            <span className="font-medium text-gray-900">{organiser.name || 'Unknown'}</span>
                        </div>
                        <div className="flex text-sm">
                            <span className="text-gray-500 w-24">Starts:</span>
                            <span className="font-medium text-gray-900">{formattedDate}</span>
                        </div>
                        <div className="flex text-sm">
                            <span className="text-gray-500 w-24">Team:</span>
                            <span className="font-medium text-gray-900">{teamName}</span>
                        </div>
                        <div
                            className="flex justify-between items-center bg-indigo-50 hover:bg-indigo-100 cursor-pointer -mx-6 px-6 py-2 mt-4 border-t border-b border-indigo-100 transition-colors"
                            onClick={() => setSelectedTicket(registration)}
                        >
                            <span className="font-semibold text-indigo-700 text-xs uppercase flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg>
                                View Ticket
                            </span>
                            <span className="font-mono text-sm font-bold text-indigo-900 bg-white px-2 py-0.5 rounded shadow-sm border border-indigo-200">
                                {registration.ticketId || registration._id.slice(-8).toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Participation Status</span>
                        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${event.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                            {event.status === 'Completed' ? 'Attended' : 'Confirmed'}
                        </span>
                    </div>

                    {event.status !== 'Completed' && event.status !== 'Cancelled' && event.status !== 'Closed' && (
                        <button
                            onClick={() => handleCancelRegistration(registration._id)}
                            className="w-full mt-2 py-2 px-4 border border-red-200 rounded-md shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                        >
                            Cancel Registration
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 border-b border-gray-200 pb-6">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Events Dashboard</h1>
                        <p className="mt-2 text-sm text-gray-600">Review your event registrations and manage participation.</p>
                    </div>
                    <button
                        onClick={() => navigate('/browse')}
                        className="mt-4 md:mt-0 px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg shadow hover:bg-indigo-700 transition"
                    >
                        Browse New Events
                    </button>
                </div>

                {/* Section 1: Upcoming Events */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                        <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        Upcoming Events
                    </h2>
                    {upcomingEvents.length === 0 ? (
                        <div className="bg-white rounded-lg p-8 text-center border border-gray-200 shadow-sm">
                            <p className="text-gray-500">You have no upcoming events scheduled.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {upcomingEvents.map(reg => renderEventCard(reg, true))}
                        </div>
                    )}
                </div>

                {/* Section 2: Participation History */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                        <svg className="w-6 h-6 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Participation History
                    </h2>

                    {/* Tabbed Navigation */}
                    <div className="border-b border-gray-200 mb-6 overflow-x-auto">
                        <nav className="-mb-px flex space-x-8 min-w-max" aria-label="Tabs">
                            {tabs.map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`
                                        whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors
                                        ${activeTab === tab
                                            ? 'border-indigo-500 text-indigo-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                                    `}
                                >
                                    {tab}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* History Grid */}
                    {filteredHistory.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-medium text-gray-900">No events found</h3>
                            <p className="mt-1 text-gray-500">You don't have any past registrations in the '{activeTab}' category.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredHistory.map(reg => renderEventCard(reg, false))}
                        </div>
                    )}
                </div>
            </div>

            {/* Ticket Modal */}
            <TicketModal
                isOpen={!!selectedTicket}
                onClose={() => setSelectedTicket(null)}
                registration={selectedTicket}
            />
        </div>
    );
};

export default MyRegistrations;
