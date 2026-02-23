import { useState, useEffect } from 'react';
import api from '../services/api';

export default function EventFeed() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Technical', 'Cultural', 'Sports', 'Social', 'Academic'];

  // Fetch all events on mount
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api.get('/events');
        setEvents(response.data.events || []);
        setFilteredEvents(response.data.events || []);
      } catch (err) {
        const errorMsg = err.response?.data?.message || 'Failed to fetch events. Please try again.';
        setError(errorMsg);
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Filter events based on search term and category
  useEffect(() => {
    let result = events;

    // Filter by category
    if (selectedCategory !== 'All') {
      result = result.filter(event => event.category === selectedCategory);
    }

    // Filter by search term (title and description)
    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(event =>
        event.title.toLowerCase().includes(lowerSearchTerm) ||
        event.description.toLowerCase().includes(lowerSearchTerm)
      );
    }

    setFilteredEvents(result);
  }, [searchTerm, selectedCategory, events]);

  // Format date to readable string
  const formatDate = (dateString) => {
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Handle registration button click
  const handleRegister = (eventId) => {
    console.log('Register clicked for event ID:', eventId);
    // TODO: Implement registration functionality
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Event Feed</h1>
          <p className="text-gray-600">Discover and register for upcoming events</p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Events
              </label>
              <input
                type="text"
                placeholder="Search by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category Filter */}
            <div className="md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results count */}
          <p className="text-sm text-gray-600 mt-4">
            Found <span className="font-semibold">{filteredEvents.length}</span> event(s)
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-8">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center min-h-96">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading events...</p>
            </div>
          </div>
        )}

        {/* No Events State */}
        {!loading && filteredEvents.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 text-lg">
              {events.length === 0
                ? 'No events available at the moment.'
                : 'No events match your search criteria.'}
            </p>
          </div>
        )}

        {/* Events Grid */}
        {!loading && filteredEvents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map(event => (
              <div
                key={event._id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden flex flex-col"
              >
                {/* Card Header */}
                <div className="p-6 flex-1 flex flex-col">
                  {/* Title */}
                  <h2 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                    {event.title}
                  </h2>

                  {/* Category Badge */}
                  <div className="mb-3">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                      {event.category}
                    </span>
                  </div>

                  {/* Date and Venue */}
                  <div className="text-sm text-gray-600 mb-4 space-y-1">
                    <p className="flex items-center">
                      <span className="font-semibold mr-2">📅</span>
                      {formatDate(event.date)}
                    </p>
                    <p className="flex items-center">
                      <span className="font-semibold mr-2">📍</span>
                      {event.venue}
                    </p>
                    {event.capacity && (
                      <p className="flex items-center">
                        <span className="font-semibold mr-2">👥</span>
                        Capacity: {event.capacity}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-gray-700 text-sm line-clamp-3 mb-4 flex-1">
                    {event.description}
                  </p>
                </div>

                {/* Register Button */}
                <div className="px-6 pb-6 pt-2 border-t border-gray-200">
                  <button
                    onClick={() => handleRegister(event._id)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
                  >
                    Register
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
