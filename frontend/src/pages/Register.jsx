import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Participant',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const isValidEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.fullName.trim()) {
      return setError('full name is required');
    }
    if (!isValidEmail(formData.email)) {
      return setError('please enter a valid email');
    }
    if (formData.password.length < 6) {
      return setError('password should be at least 6 characters');
    }
    if (formData.password !== formData.confirmPassword) {
      return setError('passwords do not match');
    }

    try {
      setLoading(true);

      await api.post('/auth/register', {
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      setSuccess('registered successfully, you can login now');
      setTimeout(() => navigate('/login'), 800);
    } catch (error) {
      console.error('registration failed:', error);
      setError(error.response?.data?.message || 'registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Felicity Register</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Full Name</label>
            <input 
              type="text" 
              name="fullName"
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Email Address</label>
            <input 
              type="email" 
              name="email"
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 mb-2">Password</label>
              <input 
                type="password" 
                name="password"
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Confirm Password</label>
              <input 
                type="password" 
                name="confirmPassword"
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Role</label>
            <select 
              name="role"
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="Participant">Participant</option>
              <option value="Organizer">Organizer</option>
            </select>
          </div>
          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded p-2">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 text-sm text-green-600 bg-green-50 border border-green-100 rounded p-2">
              {success}
            </div>
          )}
          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition duration-200 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account? <a href="/login" className="text-blue-600 hover:underline">Sign In</a>
        </p>
      </div>
    </div>
  );
}

export default Register;