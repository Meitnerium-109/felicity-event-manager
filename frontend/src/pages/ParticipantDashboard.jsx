import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function ParticipantDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Welcome Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h1 className="text-4xl font-bold text-blue-800 mb-2">
            Welcome, {user?.name}! 👋
          </h1>
          <p className="text-gray-600 text-lg">
            You're all set to discover amazing events and build your network.
          </p>
          <div className="mt-4 flex items-center gap-4">
            <span className="text-sm text-gray-600">Email: <span className="font-semibold text-gray-700">{user?.email}</span></span>
            <span className="text-sm text-gray-600">Role: <span className="font-semibold text-green-700">{user?.role}</span></span>
          </div>
        </div>

        {/* My Registered Events */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            📋 My Registered Events
          </h2>
          <p className="text-gray-600 text-center py-8">
            No registered events yet. Visit the event feed to register for events!
          </p>
        </div>

        {/* Logout Button */}
        <div className="flex gap-4">
          <button 
            onClick={() => navigate('/events')}
            className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold"
          >
            View All Events
          </button>
          <button 
            onClick={logout}
            className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition font-semibold"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default ParticipantDashboard;
