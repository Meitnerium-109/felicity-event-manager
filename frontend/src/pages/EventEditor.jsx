import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const EventEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    // Event & Meta states
    const [event, setEvent] = useState(null);
    const [registrationCount, setRegistrationCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    // Form inputs
    const [formData, setFormData] = useState({
        eventName: '',
        eventDescription: '',
        registrationDeadline: '',
        registrationLimit: '',
        status: 'Draft' // Initial default
    });

    useEffect(() => {
        const fetchEventForEditing = async () => {
            try {
                setLoading(true);
                // Fetch the event
                const eventRes = await api.get(`/events/${id}`);
                const fetchedEvent = eventRes.data.event;

                // Block if not the organiser (server handles it too, but we can do UI block)
                if (fetchedEvent.organiserId?._id !== user._id && user.role !== 'Admin') {
                    setError('Unauthorized. Only the Organiser can edit this event.');
                    setLoading(false);
                    return;
                }

                setEvent(fetchedEvent);
                setFormData({
                    eventName: fetchedEvent.eventName || fetchedEvent.title || '',
                    eventDescription: fetchedEvent.eventDescription || fetchedEvent.description || '',
                    registrationDeadline: fetchedEvent.registrationDeadline
                        ? new Date(fetchedEvent.registrationDeadline).toISOString().slice(0, 16)
                        : '',
                    registrationLimit: fetchedEvent.registrationLimit || '',
                    status: fetchedEvent.status || 'Draft'
                });

                // Fetch Registration Count to determine lock state
                // Using the specific participants endpoint for organisers
                try {
                    const partsRes = await api.get(`/events/${id}/participants`);
                    setRegistrationCount(partsRes.data.registrations?.length || 0);
                } catch (e) {
                    console.error('Cannot fetch participant count', e);
                    // Assume 0 if fails or let the user handle it
                }

            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load event details.');
            } finally {
                setLoading(false);
            }
        };

        fetchEventForEditing();
    }, [id, user]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setSaving(true);

        try {
            // Depending on status, we might need to strictly limit what we send, 
            // but the backend `updateEvent` route already enforces this. 
            // We just send the form data.
            let payload = { ...formData };

            // Convert to proper types
            if (payload.registrationLimit) {
                payload.registrationLimit = Number(payload.registrationLimit);
            }
            if (payload.registrationDeadline) {
                payload.registrationDeadline = new Date(payload.registrationDeadline).toISOString();
            }

            const response = await api.put(`/events/${id}`, payload);
            setMessage(response.data.message || 'Event saved successfully!');
            // Update local event state to reflect new status
            setEvent(response.data.event);

            // After save, the status might have changed rules, just navigating back makes it simple, 
            // but we can stay on page and let user see updated locks.
            setTimeout(() => {
                navigate('/manage-events');
            }, 1000);

        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update event.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-32 min-h-screen bg-gray-50">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error && !event) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-start pt-20 justify-center px-4">
                <div className="bg-red-50 text-red-700 p-6 rounded-lg max-w-lg w-full text-center border border-red-200 shadow-sm">
                    <p className="font-bold text-lg mb-2">Error Loading Event</p>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    // Determine strict UI Lock rules based on current event status
    const currentStatus = event.status || 'Draft';

    // Status Rules:
    // Draft: Everything editable
    // Published: Only eventDescription, extending registrationDeadline, increasing registrationLimit, and changing status to Closed.
    // Ongoing / Completed: Everything disabled except status changing to Closed/Completed.
    const isDraft = currentStatus === 'Draft';
    const isPublished = currentStatus === 'Published';
    const isOngoingOrCompleted = currentStatus === 'Ongoing' || currentStatus === 'Completed';
    const isClosed = currentStatus === 'Closed';

    // The Form Builder represents `customFormFields`.
    // The prompt: "If registrationCount > 0, completely disable the custom form builder section."
    const formBuilderLocked = registrationCount > 0 || isOngoingOrCompleted || isClosed;

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">

                <div className="mb-8 flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                            Editing Event
                            <span className={`text-xs px-2.5 py-1 rounded-md uppercase tracking-wider font-bold
                                ${isDraft ? 'bg-gray-100 text-gray-700 border border-gray-200' : ''}
                                ${isPublished ? 'bg-green-100 text-green-700 border border-green-200' : ''}
                                ${isOngoingOrCompleted ? 'bg-blue-100 text-blue-700 border border-blue-200' : ''}
                                ${isClosed ? 'bg-red-100 text-red-700 border border-red-200' : ''}
                            `}>
                                Status: {currentStatus}
                            </span>
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Apply specific updates based on the event's lifecycle stages.
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-bold text-indigo-700 uppercase tracking-widest">Registrations</p>
                        <p className="text-2xl font-black text-indigo-900">{registrationCount}</p>
                    </div>
                </div>

                {message && <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 shadow-sm rounded">{message}</div>}
                {error && <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 shadow-sm rounded">{error}</div>}

                <form onSubmit={handleSave} className="space-y-6 bg-white shadow-sm rounded-xl border border-gray-200 p-8">

                    {/* Event Name */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center justify-between">
                            Event Name
                            {!isDraft && <span className="text-[10px] bg-red-50 text-red-600 px-2 rounded-full uppercase">Locked</span>}
                        </label>
                        <input
                            type="text"
                            name="eventName"
                            value={formData.eventName}
                            onChange={handleInputChange}
                            required
                            disabled={!isDraft}
                            className={`block w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm sm:text-sm ${!isDraft ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'focus:ring-indigo-500 focus:border-indigo-500'}`}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center justify-between">
                            Event Description
                            {isOngoingOrCompleted || isClosed ? <span className="text-[10px] bg-red-50 text-red-600 px-2 rounded-full uppercase">Locked</span> : null}
                        </label>
                        <textarea
                            name="eventDescription"
                            value={formData.eventDescription}
                            onChange={handleInputChange}
                            required
                            disabled={isOngoingOrCompleted || isClosed}
                            rows="4"
                            className={`block w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm sm:text-sm ${isOngoingOrCompleted || isClosed ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'focus:ring-indigo-500 focus:border-indigo-500'}`}
                        ></textarea>
                        {isPublished && <span className="text-xs text-indigo-600 mt-1 block">Description format updates are allowed.</span>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Deadline */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center justify-between">
                                Registration Deadline
                                {isOngoingOrCompleted || isClosed ? <span className="text-[10px] bg-red-50 text-red-600 px-2 rounded-full uppercase">Locked</span> : null}
                            </label>
                            <input
                                type="datetime-local"
                                name="registrationDeadline"
                                value={formData.registrationDeadline}
                                onChange={handleInputChange}
                                required
                                disabled={isOngoingOrCompleted || isClosed}
                                className={`block w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm sm:text-sm ${isOngoingOrCompleted || isClosed ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'focus:ring-indigo-500 focus:border-indigo-500'}`}
                            />
                            {isPublished && <span className="text-xs text-indigo-600 mt-1 block">You can only extend this date.</span>}
                        </div>

                        {/* Limit */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center justify-between">
                                Registration Limit
                                {isOngoingOrCompleted || isClosed ? <span className="text-[10px] bg-red-50 text-red-600 px-2 rounded-full uppercase">Locked</span> : null}
                            </label>
                            <input
                                type="number"
                                name="registrationLimit"
                                value={formData.registrationLimit}
                                onChange={handleInputChange}
                                required
                                min={event.registrationLimit || 1}
                                disabled={isOngoingOrCompleted || isClosed}
                                className={`block w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm sm:text-sm ${isOngoingOrCompleted || isClosed ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'focus:ring-indigo-500 focus:border-indigo-500'}`}
                            />
                            {isPublished && <span className="text-xs text-indigo-600 mt-1 block">You can only increase the limit.</span>}
                        </div>
                    </div>

                    {/* Status Dropdown */}
                    <div className="pt-4 border-t border-gray-100">
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                            Status Control
                            {currentStatus === 'Closed' ? <span className="text-[10px] bg-red-50 text-red-600 px-2 rounded-full uppercase">Event is permanently closed</span> : null}
                        </label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            disabled={currentStatus === 'Closed'}
                            className={`block w-full md:w-1/2 px-4 py-3 font-bold uppercase tracking-wider text-sm bg-gray-50 border border-gray-300 rounded-md shadow-sm ${currentStatus === 'Closed' ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 border-indigo-200'}`}
                        >
                            {isDraft && <option value="Draft">Draft</option>}
                            {isDraft && <option value="Published">Publish Event (Live)</option>}

                            {isPublished && <option value="Published">Published (Live)</option>}
                            {isPublished && <option value="Closed">Close Registrations</option>}

                            {isOngoingOrCompleted && <option value={currentStatus}>{currentStatus}</option>}
                            {isOngoingOrCompleted && <option value="Completed">Mark as Completed</option>}
                            {isOngoingOrCompleted && <option value="Closed">Close Event</option>}

                            {currentStatus === 'Closed' && <option value="Closed">Closed</option>}
                        </select>
                        {currentStatus === 'Draft' && <p className="text-xs text-gray-500 mt-2 font-medium">Publishing this event will lock basic details like the name and venue. If Discord is connected, an announcement will be sent.</p>}
                    </div>

                    {/* Registration Count Form Builder Lock Message */}
                    {formBuilderLocked && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5 mt-8 flex items-start gap-4">
                            <div className="text-yellow-600 mt-0.5">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-yellow-800 uppercase tracking-wider mb-1">Custom Fields Locked</h4>
                                <p className="text-sm text-yellow-700">
                                    {registrationCount > 0
                                        ? "Since participants have already registered, the custom form builder is strictly locked to prevent structural mismatch in the data."
                                        : "The form builder is locked because the event has progressed past the Published phase."
                                    }
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="pt-8">
                        <button
                            type="submit"
                            disabled={saving || currentStatus === 'Closed'}
                            className={`w-full py-3 px-4 border border-transparent rounded-lg shadow-md text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all ${saving || currentStatus === 'Closed' ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
                        >
                            {saving ? 'Processing Update...' : 'Save Strict Changes'}
                        </button>
                    </div>

                </form>

            </div>
        </div>
    );
};

export default EventEditor;
