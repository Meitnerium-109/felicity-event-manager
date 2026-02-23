import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function CreateEvent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    venue: '',
    capacity: '',
    category: 'Technical',
  });

  const categories = ['Technical', 'Cultural', 'Sports', 'Social', 'Academic'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (!formData.title || !formData.description || !formData.date || !formData.venue || !formData.category) {
      setMessage('Please fill in all required fields');
      setIsSuccess(false);
      setLoading(false);
      return;
    }

  try {
      // Look how clean this is now! No manual headers or cookie flags needed.
      const response = await api.post('/events', formData);
      
      setMessage('Event created successfully!');
      setIsSuccess(true);
      
      
      setMessage('Event created successfully!');
      setIsSuccess(true);
      setFormData({
        title: '',
        description: '',
        date: '',
        venue: '',
        capacity: '',
        category: 'Technical',
      });

      setTimeout(() => navigate('/organiser-dashboard'), 2000);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to create event. Please try again.';
      setMessage(errorMsg);
      setIsSuccess(false);
      console.error('Error creating event:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Create Event</h1>

        {message && (
          <div className={`mb-4 p-3 rounded text-center ${
            isSuccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text" name="title" value={formData.title} onChange={handleChange} required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              name="description" value={formData.description} onChange={handleChange} required rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input
              type="datetime-local" name="date" value={formData.date} onChange={handleChange} required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Venue *</label>
            <input
              type="text" name="venue" value={formData.venue} onChange={handleChange} required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (Optional)</label>
            <input
              type="number" name="capacity" value={formData.capacity} onChange={handleChange} min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              name="category" value={formData.category} onChange={handleChange} required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition duration-200">
            {loading ? 'Creating...' : 'Create Event'}
          </button>
          <button type="button" onClick={() => navigate('/organiser-dashboard')} className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition duration-200">
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateEvent;