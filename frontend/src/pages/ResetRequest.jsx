import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function ResetRequest() {
    const [formData, setFormData] = useState({
        organiserEmail: '',
        clubName: '',
        reason: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        setError(null);

        if (!formData.organiserEmail || !formData.clubName || !formData.reason) {
            setError('Please fill in all fields.');
            return;
        }

        try {
            setLoading(true);
            const res = await api.post('/auth/request-reset', formData);
            setMessage(res.data.message);
            setFormData({ organiserEmail: '', clubName: '', reason: '' });
        } catch (err) {
            setError(err.response?.data?.message || 'Server error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Organiser Access Recovery</h2>
                    <p className="text-sm text-gray-600">
                        Submit a request to the Administration team to securely reset your club's password.
                    </p>
                </div>

                {message && (
                    <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-green-700 font-medium">{message}</p>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                        <p className="text-sm text-red-700 font-medium">{error}</p>
                    </div>
                )}

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="clubName" className="block text-sm font-medium text-gray-700">Official Club / Organiser Name</label>
                        <div className="mt-1">
                            <input
                                id="clubName"
                                name="clubName"
                                type="text"
                                required
                                value={formData.clubName}
                                onChange={handleChange}
                                placeholder="e.g. Debate Club"
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="organiserEmail" className="block text-sm font-medium text-gray-700">Authorised Club Login Email</label>
                        <div className="mt-1">
                            <input
                                id="organiserEmail"
                                name="organiserEmail"
                                type="email"
                                required
                                value={formData.organiserEmail}
                                onChange={handleChange}
                                placeholder="debate-iiit@clubs.iiit.ac.in"
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Reason for Recovery Request</label>
                        <div className="mt-1">
                            <textarea
                                id="reason"
                                name="reason"
                                required
                                rows={3}
                                value={formData.reason}
                                onChange={handleChange}
                                placeholder="Please explain why you need a password reset (e.g. Lost credentials, change of leadership)..."
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'} transition-colors`}
                        >
                            {loading ? 'Submitting Request...' : 'Submit Request to Admin'}
                        </button>
                    </div>
                </form>

                <div className="mt-6 text-center border-t border-gray-200 pt-4">
                    <p className="text-sm text-gray-600">
                        Remembered your password?{' '}
                        <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors">
                            Return to Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default ResetRequest;
