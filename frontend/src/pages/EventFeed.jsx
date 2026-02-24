import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function EventFeed() {
  const [events, setEvents] = useState([]);
  const [trendingEvents, setTrendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search and Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('All');
  const [selectedEligibility, setSelectedEligibility] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [followedClubsOnly, setFollowedClubsOnly] = useState(false);

  const navigate = useNavigate();

  // Fetch all events on mount or when filters change
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError('');

        // Prepare query parameters
        const params = {};
        if (searchTerm.trim()) params.search = searchTerm.trim();
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        if (followedClubsOnly) params.followedClubsOnly = true;

        const [eventsRes, trendingRes] = await Promise.all([
          api.get('/events', { params }), // sending advanced filters to backend
          api.get('/events/trending')     // fetch top 5 trending events
        ]);

        let fetchedEvents = eventsRes.data.events || [];

        // Apply remaining frontend filters (eventType and eligibility)
        if (selectedEventType !== 'All') {
          fetchedEvents = fetchedEvents.filter(event => (event.eventType || 'Normal') === selectedEventType);
        }
        if (selectedEligibility !== 'All') {
          fetchedEvents = fetchedEvents.filter(event => (event.eligibility || 'All') === selectedEligibility);
        }

        // Only show Published or Ongoing events
        fetchedEvents = fetchedEvents.filter(event => event.status === 'Published' || event.status === 'Ongoing' || !event.status);

        setEvents(fetchedEvents);
        setTrendingEvents(trendingRes.data.events || []);

      } catch (err) {
        const errorMsg = err.response?.data?.message || 'Failed to fetch events. Please try again.';
        setError(errorMsg);
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    };

    // adding a debouncer for search
    const debounceTimer = setTimeout(() => {
      fetchEvents();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, startDate, endDate, followedClubsOnly, selectedEventType, selectedEligibility]);

  // Format date to readable string
  const formatDate = (dateString) => {
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return new Date(dateString).toLocaleDateString('en-GB', options);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedEventType('All');
    setSelectedEligibility('All');
    setStartDate('');
    setEndDate('');
    setFollowedClubsOnly(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-end">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">Browse Events</h1>
            <p className="text-gray-600 text-lg">Discover and register for upcoming incredible events.</p>
          </div>
        </div>

        {/* Trending Events Banner */}
        {trendingEvents && trendingEvents.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-6 h-6 text-orange-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd"></path></svg>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Trending Now</h2>
              <span className="text-sm text-gray-500 ml-2">(Top {trendingEvents.length} in last 24h)</span>
            </div>
            <div className="flex overflow-x-auto gap-4 pb-4 snap-x">
              {trendingEvents.map((event) => (
                <div key={event._id} onClick={() => navigate(`/events/${event._id}`)} className="snap-start cursor-pointer min-w-[300px] sm:min-w-[350px] bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded backdrop-blur-sm uppercase tracking-wider">{event.category || 'General'}</span>
                    {event.fee === 0 ? <span className="text-green-300 font-bold text-sm">FREE</span> : <span className="font-bold text-sm">₹{event.fee}</span>}
                  </div>
                  <h3 className="text-xl font-bold mb-2 line-clamp-2">{event.eventName || event.title}</h3>
                  <p className="text-indigo-100 text-sm mb-4 line-clamp-2">{event.eventDescription || event.description}</p>
                  <div className="flex items-center text-sm font-medium">
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    {formatDate(event.startDate || event.date)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search & Filter Component */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
              Advanced Filters
            </h3>
            {(searchTerm || selectedEventType !== 'All' || selectedEligibility !== 'All' || startDate || endDate || followedClubsOnly) && (
              <button onClick={clearFilters} className="text-xs font-semibold text-red-600 hover:text-red-800 transition-colors uppercase tracking-wider">
                Clear All
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">

            {/* Search Input */}
            <div className="md:col-span-12 lg:col-span-5">
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                Search Events
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Enter event name or title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                />
              </div>
            </div>

            {/* Event Type */}
            <div className="md:col-span-4 lg:col-span-2">
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                Event Type
              </label>
              <select
                value={selectedEventType}
                onChange={(e) => setSelectedEventType(e.target.value)}
                className="block w-full py-2.5 px-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors cursor-pointer"
              >
                <option value="All">All Types</option>
                <option value="Normal">Normal</option>
                <option value="Merchandise">Merchandise</option>
              </select>
            </div>

            {/* Eligibility */}
            <div className="md:col-span-4 lg:col-span-2">
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                Eligibility
              </label>
              <select
                value={selectedEligibility}
                onChange={(e) => setSelectedEligibility(e.target.value)}
                className="block w-full py-2.5 px-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors cursor-pointer"
              >
                <option value="All">All Allowed</option>
                <option value="IIIT">IIIT Only</option>
                <option value="Non-IIIT">Non-IIIT Only</option>
              </select>
            </div>

            {/* Followed Clubs Toggle */}
            <div className="md:col-span-4 lg:col-span-3 flex items-end pb-1">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={followedClubsOnly} onChange={(e) => setFollowedClubsOnly(e.target.checked)} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                <span className="ml-3 text-sm font-semibold text-gray-700">Followed Clubs Only</span>
              </label>
            </div>

            {/* Date Range Picker */}
            <div className="col-span-12 flex flex-col sm:flex-row gap-4 mt-2">
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                  Start Date (From)
                </label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="block w-full py-2.5 px-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors text-gray-700" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                  End Date (To)
                </label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="block w-full py-2.5 px-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors text-gray-700" />
              </div>
            </div>

          </div>
        </div>

        {/* Results Info */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            Found <span className="text-indigo-600">{events.length}</span> Event{events.length !== 1 && 's'}
          </h2>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-sm mb-8">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-32">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {/* No Events State */}
        {!loading && events.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              We couldn't find anything matching your current filters. Try adjusting your search criteria.
            </p>
          </div>
        )}

        {/* Events Grid */}
        {!loading && events.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map(event => (
              <div
                key={event._id}
                className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col overflow-hidden group"
              >
                {/* Card Header Content */}
                <div className="p-6 flex-1 flex flex-col">
                  {/* Title */}
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                      {event.eventName || event.title}
                    </h2>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {event.eventType || 'Normal'}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-100">
                      {event.eligibility || 'All'}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200">
                      {event.category || 'General'}
                    </span>
                  </div>

                  {/* Date and Details */}
                  <div className="space-y-2 mt-2 mb-6 border-l-2 border-indigo-100 pl-3">
                    <div className="flex items-start text-sm text-gray-600">
                      <svg className="w-5 h-5 mr-3 text-indigo-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      <span className="font-medium text-gray-900">{formatDate(event.startDate || event.date)}</span>
                    </div>
                    {event.venue && (
                      <div className="flex items-start text-sm text-gray-600">
                        <svg className="w-5 h-5 mr-3 text-indigo-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        <span className="line-clamp-1">{event.venue}</span>
                      </div>
                    )}
                    <div className="flex items-start text-sm text-gray-600">
                      <svg className="w-5 h-5 mr-3 text-indigo-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg>
                      <span className="font-medium text-green-600">{event.fee > 0 ? `₹${event.fee}` : 'Free Entry'}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-500 text-sm line-clamp-3 mt-auto pt-4 border-t border-gray-100">
                    {event.eventDescription || event.description}
                  </p>
                </div>

                {/* View Details Button */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-center">
                  <button
                    onClick={() => navigate(`/events/${event._id}`)}
                    className="w-full inline-flex justify-center items-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-lg shadow-sm transition-all duration-200 group-hover:shadow-md"
                  >
                    View Details
                    <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}