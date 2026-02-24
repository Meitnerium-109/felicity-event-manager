import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

function Register() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    contactNumber: '',
    collegeName: '',
    participantType: 'IIIT',
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

  const isIIITEmail = (value) => {
    return /@(iiit\.ac\.in|research\.iiit\.ac\.in|students\.iiit\.ac\.in)$/.test(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      return setError('first name and last name are required');
    }
    if (!formData.contactNumber.trim()) {
      return setError('contact number is required');
    }
    if (formData.participantType === 'Non-IIIT' && !formData.collegeName.trim()) {
      return setError('college name is required for Non-IIIT participants');
    }
    if (!isValidEmail(formData.email)) {
      return setError('please enter a valid email');
    }
    if (formData.participantType === 'IIIT' && !isIIITEmail(formData.email)) {
      return setError('IIIT participants must use an official @iiit.ac.in, @research.iiit.ac.in, or @students.iiit.ac.in email address.');
    }
    if (formData.password.length < 6) {
      return setError('password should be at least 6 characters');
    }
    if (formData.password !== formData.confirmPassword) {
      return setError('passwords do not match');
    }

    try {
      setLoading(true);

      const res = await api.post('/auth/register', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        participantType: formData.participantType,
        contactNumber: formData.contactNumber,
        collegeName: formData.collegeName || 'IIIT Hyderabad', // Backend defaults to IIIT Hyderabad for IIIT anyway
      });

      localStorage.setItem('felicity_token', res.data.token);
      login(res.data.user);

      setSuccess('registered successfully! redirecting to onboarding...');
      setTimeout(() => navigate('/onboarding'), 800);
    } catch (error) {
      console.error('registration failed:', error);
      setError(error.response?.data?.message || 'registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 py-12">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Felicity Register</h2>
        <form onSubmit={handleSubmit}>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 mb-2">First Name</label>
              <input
                type="text"
                name="firstName"
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Last Name</label>
              <input
                type="text"
                name="lastName"
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Participant Type</label>
            <select
              name="participantType"
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={formData.participantType}
              onChange={handleChange}
            >
              <option value="IIIT">IIIT Student</option>
              <option value="Non-IIIT">Non-IIIT Student</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              name="email"
              className={`w-full p-2 border ${formData.participantType === 'IIIT' && formData.email && !isIIITEmail(formData.email) ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-2 focus:ring-blue-400`}
              value={formData.email}
              onChange={handleChange}
              required
            />
            {formData.participantType === 'IIIT' && (
              <p className="text-xs text-gray-500 mt-1">Must be a valid @iiit.ac.in, @research.iiit.ac.in, or @students.iiit.ac.in address</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 mb-2">Contact Number</label>
              <input
                type="tel"
                name="contactNumber"
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={formData.contactNumber}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">College Name</label>
              <input
                type="text"
                name="collegeName"
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:text-gray-500"
                value={formData.participantType === 'IIIT' ? 'IIIT Hyderabad' : formData.collegeName}
                onChange={handleChange}
                disabled={formData.participantType === 'IIIT'}
                required={formData.participantType === 'Non-IIIT'}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
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

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded p-3">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 text-sm text-green-600 bg-green-50 border border-green-100 rounded p-3">
              {success}
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700 transition duration-200 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account? <a href="/login" className="text-blue-600 font-medium hover:underline">Sign In</a>
        </p>
      </div>
    </div>
  );
}

export default Register;