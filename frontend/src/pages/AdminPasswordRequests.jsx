import { useState, useEffect } from 'react';
import api from '../services/api';

function AdminPasswordRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/password-resets');
            setRequests(res.data.requests);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load password reset requests.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAction = async (id, status) => {
        const comment = window.prompt(`Please provide a reason for marking this request as ${status}:`);
        if (comment === null) return; // Prompt cancelled

        try {
            const res = await api.put(`/admin/password-resets/${id}`, {
                status,
                adminComment: comment
            });

            // If approved, show the new password to the Admin
            if (status === 'Approved' && res.data.credentials) {
                alert(`SUCCESS! Request Approved.\n\nNew Plaintext Password for ${res.data.credentials.loginEmail}:\n\n${res.data.credentials.plainPassword}\n\nPlease copy this password and share it with the club representative immediately. It will not be shown again.`);
            } else {
                alert(res.data.message);
            }

            // Refresh list
            fetchRequests();
        } catch (err) {
            alert(err.response?.data?.message || `Failed to ${status.toLowerCase()} request.`);
        }
    };

    if (loading && requests.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-8 flex justify-center mt-10">
                <div className="bg-red-50 text-red-700 p-4 rounded-md shadow-sm border border-red-200">
                    <p className="font-bold">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">Password Reset Queue</h1>
                        <p className="text-sm text-gray-500 mt-2">Manage requested password rotations for Organiser accounts.</p>
                    </div>
                    <button
                        onClick={fetchRequests}
                        className="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md shadow-sm hover:bg-gray-50 text-sm font-semibold transition"
                    >
                        Refresh Queue
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Club Target</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason provided</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {requests.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500 italic">
                                            No password reset requests pending.
                                        </td>
                                    </tr>
                                ) : (
                                    requests.map((req) => (
                                        <tr key={req._id} className={req.status === 'Pending' ? 'bg-white' : 'bg-gray-50 opacity-80'}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                                {new Date(req.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-gray-900">{req.clubName}</div>
                                                <div className="text-xs text-gray-500">{req.organiserEmail}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-700 line-clamp-2 max-w-xs">{req.reason}</p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${req.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                                        req.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                                            'bg-amber-100 text-amber-800'
                                                    }`}>
                                                    {req.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {req.status === 'Pending' ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleAction(req._id, 'Approved')}
                                                            className="bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 py-1.5 px-3 rounded-md transition font-bold"
                                                        >
                                                            Approve Reset
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(req._id, 'Rejected')}
                                                            className="bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 py-1.5 px-3 rounded-md transition font-bold"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic" title={req.adminComment}>
                                                        Processed
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminPasswordRequests;
