import { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import QRScannerModal from '../components/QRScannerModal';

function OrganizerEventDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [event, setEvent] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusUpdating, setStatusUpdating] = useState(false);

    // Filters & Modals
    const [searchTerm, setSearchTerm] = useState('');
    const [attendanceFilter, setAttendanceFilter] = useState('All');
    const [activeTab, setActiveTab] = useState('participants'); // 'participants' or 'pendingOrders'
    const [showScanner, setShowScanner] = useState(false);

    const fetchDetails = useCallback(async () => {
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
    }, [id]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

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

    const handleReviewOrder = async (registrationId, reviewStatus) => {
        if (!window.confirm(`Are you sure you want to ${reviewStatus.toLowerCase()} this order?`)) return;
        try {
            const res = await api.put(`/registrations/review/${registrationId}`, { reviewStatus });
            alert(res.data.message);

            // Optimistically update the local state
            setParticipants(prev => prev.map(reg => {
                if (reg._id === registrationId) {
                    return { ...reg, status: reviewStatus };
                }
                return reg;
            }));

            // Decrement stock if approved locally
            if (reviewStatus === 'Approved') {
                setEvent(prev => ({ ...prev, stockQuantity: prev.stockQuantity - 1 }));
            }
        } catch (err) {
            console.error('Review order failed:', err);
            alert(err.response?.data?.message || `Failed to ${reviewStatus.toLowerCase()} order.`);
        }
    };

    const handleManualOverride = async (ticketId) => {
        if (!window.confirm("Mark participant as manually checked-in?")) return;

        try {
            const res = await api.put('/registrations/attendance', { ticketId, isManualOverride: true });
            alert(res.data.message);
            // Refresh table
            fetchDetails();
        } catch (err) {
            console.error('Manual override failed:', err);
            alert(err.response?.data?.message || 'Failed to manually verify ticket.');
        }
    };

    // Derived states
    const filteredParticipants = useMemo(() => {
        return participants.filter(reg => {
            // Exclude pending orders from the main participants list unless they are explicitly successful or we want all
            if (activeTab === 'participants' && reg.status === 'Pending Approval') return false;

            const userObj = reg.participantId || {};
            const name = (userObj.name || `${userObj.firstName || ''} ${userObj.lastName || ''}`).toLowerCase();
            const email = (userObj.email || '').toLowerCase();
            const term = searchTerm.toLowerCase();

            const matchesSearch = name.includes(term) || email.includes(term);

            let matchesAttendance = true;
            if (attendanceFilter !== 'All') {
                const isPresent = reg.attendanceStatus === true;
                matchesAttendance = attendanceFilter === 'Present' ? isPresent : !isPresent;
            }

            return matchesSearch && matchesAttendance;
        });
    }, [participants, searchTerm, attendanceFilter, activeTab]);

    const pendingOrders = useMemo(() => {
        return participants.filter(reg => reg.status === 'Pending Approval');
    }, [participants]);

    // Analytics calculations
    const analytics = useMemo(() => {
        if (!event) return { regCount: 0, attendanceCount: 0, revenue: 0, teamCompletion: 'N/A' };

        // Exclude pending merchandise orders from hard counts until approved
        const validRegs = participants.filter(r => r.status !== 'Pending Approval' && r.status !== 'Rejected');
        const regCount = validRegs.length;
        const attendanceCount = validRegs.filter(r => r.attendanceStatus === true).length;
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
        const headers = ['Name', 'Email', 'Registration Date', 'Payment Status', 'Team Name', 'Attendance Status', 'Scan Timestamp'];

        const rows = filteredParticipants.map(reg => {
            const userObj = reg.participantId || {};
            const name = userObj.name || `${userObj.firstName || ''} ${userObj.lastName || ''}`.trim() || 'Unknown';
            const email = userObj.email || 'N/A';
            const date = new Date(reg.createdAt).toLocaleDateString('en-US');
            const paymentStatus = reg.paymentStatus || 'Pending';
            const teamName = reg.teamName || 'N/A';
            const attendanceStatus = reg.attendanceStatus ? 'Present' : 'Absent';
            const logTimestamp = reg.attendanceTimestamp ? new Date(reg.attendanceTimestamp).toLocaleString('en-US') : 'N/A';

            // Escape quotes inside cells
            const escapeCSV = (str) => `"${String(str).replace(/"/g, '""')}"`;

            return [
                escapeCSV(name),
                escapeCSV(email),
                escapeCSV(date),
                escapeCSV(paymentStatus),
                escapeCSV(teamName),
                escapeCSV(attendanceStatus),
                escapeCSV(logTimestamp)
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
                            <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-2">Live Attendance</p>
                            <p className="text-3xl font-black text-indigo-600 mb-2">{analytics.attendanceCount} <span className="text-sm font-bold text-gray-400">/ {analytics.regCount} Scanned</span></p>
                            <button onClick={() => setShowScanner(true)} className="mt-2 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors text-sm flex items-center justify-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
                                Launch QR Scanner
                            </button>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col justify-center">
                            <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-2">Team Metric</p>
                            <p className="text-3xl font-black text-purple-600 truncate">{analytics.teamCompletion}</p>
                        </div>
                    </div>
                </div>

                {/* Tabs Controller Space (Merchandise Only) */}
                {event.eventType === 'Merchandise' && (
                    <div className="flex space-x-4 border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('participants')}
                            className={`pb-4 px-2 font-bold text-sm tracking-wide uppercase transition-colors ${activeTab === 'participants' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            All Participants
                        </button>
                        <button
                            onClick={() => setActiveTab('pendingOrders')}
                            className={`pb-4 px-2 font-bold text-sm tracking-wide uppercase transition-colors flex items-center gap-2 ${activeTab === 'pendingOrders' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Pending Orders
                            {pendingOrders.length > 0 && (
                                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-black">
                                    {pendingOrders.length}
                                </span>
                            )}
                        </button>
                    </div>
                )}

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

                    {activeTab === 'participants' && (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-white">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 text-left text-[10px] font-black tracking-widest uppercase text-gray-500">Participant Info</th>
                                        <th scope="col" className="px-6 py-4 text-left text-[10px] font-black tracking-widest uppercase text-gray-500">Registration Date</th>
                                        <th scope="col" className="px-6 py-4 text-left text-[10px] font-black tracking-widest uppercase text-gray-500">Payment Status</th>
                                        <th scope="col" className="px-6 py-4 text-left text-[10px] font-black tracking-widest uppercase text-gray-500">Team Name</th>
                                        <th scope="col" className="px-6 py-4 text-center text-[10px] font-black tracking-widest uppercase text-gray-500">Attendance</th>
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
                                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                                        {reg.attendanceStatus ? (
                                                            <div className="flex items-center justify-center flex-col">
                                                                <span className="px-2.5 py-1 inline-flex text-[10px] leading-5 font-black uppercase tracking-wider rounded border bg-indigo-50 border-indigo-200 text-indigo-700">
                                                                    Scanned
                                                                </span>
                                                                <span className="text-[10px] text-gray-400 mt-1 font-mono">
                                                                    {new Date(reg.attendanceTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center gap-2">
                                                                <span className="px-2.5 py-1 inline-flex text-[10px] leading-5 font-black uppercase tracking-wider rounded border bg-gray-50 border-gray-200 text-gray-500">
                                                                    Absent
                                                                </span>
                                                                <button onClick={() => handleManualOverride(reg.ticketId)} className="text-[10px] bg-white hover:bg-indigo-50 text-indigo-600 border border-indigo-200 py-1 px-2 rounded transition-colors font-bold uppercase">
                                                                    Override
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {event.eventType === 'Merchandise' && activeTab === 'pendingOrders' && (
                        <div className="p-6 bg-gray-50 flex flex-col gap-6">
                            {pendingOrders.length === 0 ? (
                                <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-xl">
                                    No pending orders awaiting review.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {pendingOrders.map(order => {
                                        const userObj = order.participantId || {};
                                        const name = userObj.name || `${userObj.firstName || ''} ${userObj.lastName || ''}`.trim() || 'Unknown';

                                        return (
                                            <div key={order._id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                                                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                                    <div>
                                                        <p className="font-bold text-gray-900">{name}</p>
                                                        <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                                                    </div>
                                                </div>

                                                <div className="p-4 flex-1 flex flex-col items-center justify-center bg-gray-100/50">
                                                    {order.paymentProof ? (
                                                        <img
                                                            src={order.paymentProof}
                                                            alt={`Payment proof from ${name}`}
                                                            className="max-h-48 w-full object-contain cursor-pointer hover:opacity-90 transition rounded shadow-sm border border-gray-200"
                                                            onClick={() => window.open(order.paymentProof, '_blank')}
                                                            title="Click to enlarge"
                                                        />
                                                    ) : (
                                                        <div className="text-sm text-gray-500 italic py-8">No receipt attached</div>
                                                    )}
                                                </div>

                                                <div className="p-4 bg-white flex gap-3">
                                                    <button
                                                        onClick={() => handleReviewOrder(order._id, 'Approved')}
                                                        className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 font-bold py-2 rounded-lg border border-green-200 transition text-sm"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleReviewOrder(order._id, 'Rejected')}
                                                        className="flex-1 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 font-bold py-2 rounded-lg border border-red-200 transition text-sm"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>

            {/* Modal Injection */}
            {showScanner && (
                <QRScannerModal
                    eventId={event._id}
                    onClose={() => setShowScanner(false)}
                    onScanSuccessCallback={fetchDetails}
                />
            )}
        </div>
    );
}

export default OrganizerEventDetails;
