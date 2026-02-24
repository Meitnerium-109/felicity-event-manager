import { useState, useEffect, useContext, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

function OrganizerEventDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [event, setEvent] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusUpdating, setStatusUpdating] = useState(false);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [attendanceFilter, setAttendanceFilter] = useState('All');

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                setLoading(true);
                const [eventRes, participantsRes] = await Promise.all([
                    api.get(`/events/${id}`),
                    api.get(`/events/${id}/participants`)
                ]);

                setEvent(eventRes.data.event);
                setParticipants(participantsRes.data.registrations || []);
            } catch (err) {
                console.error('Failed to load event details:', err);
                setError('Could not load event data or you do not have permission.');
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [id]);

    const handleStatusChange = async (newStatus) => {
        try {
            setStatusUpdating(true);
            await api.put(`/events/${id}/status`, { status: newStatus });
            setEvent(prev => ({ ...prev, status: newStatus }));
            alert(`Event status updated to ${newStatus}`);
        } catch (err) {
            console.error('Status update failed:', err);
            alert(err.response?.data?.message || 'Failed to update status');
        } finally {
            setStatusUpdating(false);
        }
    };

    // Derived states
    const filteredParticipants = useMemo(() => {
        return participants.filter(reg => {
            const userObj = reg.participantId || {};
            const name = (userObj.name || `${userObj.firstName || ''} ${userObj.lastName || ''}`).toLowerCase();
            const email = (userObj.email || '').toLowerCase();
            const term = searchTerm.toLowerCase();

            const matchesSearch = name.includes(term) || email.includes(term);

            let matchesAttendance = true;
            if (attendanceFilter !== 'All') {
                const status = reg.attendanceStatus || 'Absent'; // Default if null
                matchesAttendance = status === attendanceFilter;
            }

            return matchesSearch && matchesAttendance;
        });
    }, [participants, searchTerm, attendanceFilter]);

    // Analytics calculations
    const analytics = useMemo(() => {
        if (!event) return { regCount: 0, attendanceCount: 0, revenue: 0, teamCompletion: 'N/A' };

        const regCount = participants.length;
        const attendanceCount = participants.filter(r => r.attendanceStatus === 'Present' || r.attendanceStatus === 'Attended').length;
        const revenue = regCount * (event.fee || 0);

        let teamCompletion = 'N/A';
        if (event.eventType === 'Team' && event.teamSize > 0) {
            // Rough calculation of team full-capacity ratio
            // Actual calculation depends on exact team logic you implement
            teamCompletion = `${regCount} members`;
        }

        return { regCount, attendanceCount, revenue, teamCompletion };
    }, [participants, event]);

    const exportToCSV = () => {
        if (filteredParticipants.length === 0) {
            alert('No participants in the current filtered view to export.');
            return;
        }

        // Vanilla JavaScript CSV generation
        const headers = ['Name', 'Email', 'Registration Date', 'Payment Status', 'Team Name', 'Attendance Status'];

        const rows = filteredParticipants.map(reg => {
            const userObj = reg.participantId || {};
            const name = userObj.name || `${userObj.firstName || ''} ${userObj.lastName || ''}`.trim() || 'Unknown';
            const email = userObj.email || 'N/A';
            const date = new Date(reg.createdAt).toLocaleDateString('en-US');
            const paymentStatus = reg.paymentStatus || 'Pending';
            const teamName = reg.teamName || 'N/A';
            const attendanceStatus = reg.attendanceStatus || 'Absent';

            // Escape quotes inside cells
            const escapeCSV = (str) => `"${String(str).replace(/"/g, '""')}"`;

            return [
                escapeCSV(name),
                escapeCSV(email),
                escapeCSV(date),
                escapeCSV(paymentStatus),
                escapeCSV(teamName),
                escapeCSV(attendanceStatus)
            ].join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        const safeEventName = (event?.eventName || event?.title || 'event').replace(/[^a-z0-9]/gi, '_').toLowerCase();

        link.href = url;
        link.setAttribute('download', `${safeEventName}_participants.csv`);
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-4xl mx-auto bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg text-center shadow-sm">
                    <p className="text-xl font-bold mb-4">{error || 'Event not found'}</p>
                    <button onClick={() => navigate('/manage-events')} className="bg-white border border-red-300 text-red-700 font-bold py-2 px-6 rounded-md hover:bg-red-50 transition">
                        Back to Events
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-8">

                <button
                    onClick={() => navigate('/manage-events')}
                    className="group flex items-center text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors uppercase tracking-wider"
                >
                    <svg className="w-4 h-4 mr-1.5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    Back to Ongoing Events
                </button>

                {/* Top Section: Overview & Action Controls */}
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Event Detail Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex-1 p-8">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 mb-2">{event.eventName || event.title}</h1>
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-3 py-1 rounded-md uppercase tracking-wider flex items-center">
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                                        {event.eventType || 'Normal'}
                                    </span>
                                    <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-md uppercase tracking-wider">
                                        {event.category || 'General'}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate(`/events/${event._id}/edit`)}
                                className="bg-gray-900 text-white font-bold py-2 px-5 rounded-lg text-sm shadow hover:bg-gray-800 transition"
                            >
                                Edit Details
                            </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-gray-100">
                            <div>
                                <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">Starts / Ends</p>
                                <p className="text-sm font-bold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">{new Date(event.startDate || event.date).toLocaleDateString()} - {new Date(event.endDate || event.date).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">Eligibility</p>
                                <p className="text-sm font-bold text-gray-900">{event.eligibility || 'Open to All'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">Pricing / Fee</p>
                                <p className="text-sm font-bold text-gray-900">{event.fee > 0 ? `₹${event.fee}` : 'Free'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">Current Status</p>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={event.status || 'Draft'}
                                        onChange={(e) => handleStatusChange(e.target.value)}
                                        disabled={statusUpdating}
                                        className={`text-sm font-bold border-0 bg-transparent p-0 focus:ring-0 cursor-pointer
                                            ${event.status === 'Published' ? 'text-green-600' :
                                                event.status === 'Draft' ? 'text-amber-600' :
                                                    event.status === 'Ongoing' ? 'text-blue-600' :
                                                        'text-red-600'}`}
                                    >
                                        <option value="Draft">Draft</option>
                                        <option value="Published">Published</option>
                                        <option value="Ongoing">Ongoing</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Closed">Closed</option>
                                    </select>
                                    {statusUpdating && <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-indigo-600"></div>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Analytics Overview Cards Side-Panel */}
                    <div className="w-full lg:w-1/3 grid grid-cols-2 gap-4">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col justify-center">
                            <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-2">Registrations</p>
                            <p className="text-3xl font-black text-gray-900">{analytics.regCount} <span className="text-sm font-bold text-gray-400">/ {event.registrationLimit || '∞'}</span></p>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col justify-center">
                            <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-2">Total Revenue</p>
                            <p className="text-3xl font-black text-green-600">₹{analytics.revenue}</p>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col justify-center">
                            <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-2">Attendance</p>
                            <p className="text-3xl font-black text-indigo-600">{analytics.attendanceCount}</p>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col justify-center">
                            <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-2">Team Metric</p>
                            <p className="text-3xl font-black text-purple-600 truncate">{analytics.teamCompletion}</p>
                        </div>
                    </div>
                </div>

                {/* Table & Controls Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex-1 w-full flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1 max-w-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search by name or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition shadow-sm"
                                />
                            </div>
                            <div className="w-full sm:w-48">
                                <select
                                    value={attendanceFilter}
                                    onChange={(e) => setAttendanceFilter(e.target.value)}
                                    className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-medium shadow-sm"
                                >
                                    <option value="All">All Attendance</option>
                                    <option value="Present">Present Only</option>
                                    <option value="Absent">Absent Only</option>
                                </select>
                            </div>
                        </div>

                        <button
                            onClick={exportToCSV}
                            disabled={filteredParticipants.length === 0}
                            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-bold rounded-lg shadow-sm text-white ${filteredParticipants.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors shrink-0`}
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                            Export Filtered CSV
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-white">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-[10px] font-black tracking-widest uppercase text-gray-500">Participant Info</th>
                                    <th scope="col" className="px-6 py-4 text-left text-[10px] font-black tracking-widest uppercase text-gray-500">Registration Date</th>
                                    <th scope="col" className="px-6 py-4 text-left text-[10px] font-black tracking-widest uppercase text-gray-500">Payment Status</th>
                                    <th scope="col" className="px-6 py-4 text-left text-[10px] font-black tracking-widest uppercase text-gray-500">Team Name</th>
                                    <th scope="col" className="px-6 py-4 text-right text-[10px] font-black tracking-widest uppercase text-gray-500">Attendance</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {filteredParticipants.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                            No participants found matching your filters.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredParticipants.map((reg) => {
                                        const userObj = reg.participantId || {};
                                        const name = userObj.name || `${userObj.firstName || ''} ${userObj.lastName || ''}`.trim() || 'Unknown';
                                        const email = userObj.email || 'No email';

                                        return (
                                            <tr key={reg._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="h-9 w-9 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-full flex items-center justify-center text-indigo-700 font-bold mr-3 border border-indigo-200">
                                                            {name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-gray-900">{name}</div>
                                                            <div className="text-xs text-gray-500">{email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium font-mono">
                                                    {new Date(reg.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full uppercase tracking-wider ${reg.paymentStatus === 'Completed' || reg.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                                        {reg.paymentStatus || 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                                                    {reg.teamName || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                    <span className={`px-2.5 py-1 inline-flex text-[10px] leading-5 font-black uppercase tracking-wider rounded border ${(reg.attendanceStatus === 'Present' || reg.attendanceStatus === 'Attended')
                                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                                            : 'bg-gray-50 border-gray-200 text-gray-500'
                                                        }`}>
                                                        {reg.attendanceStatus || 'Absent'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default OrganizerEventDetails;
