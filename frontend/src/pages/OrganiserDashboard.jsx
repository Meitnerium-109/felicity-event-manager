import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function OrganiserDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-blue-800 mb-4">Organiser Dashboard</h1>
        <p className="text-gray-700 text-lg mb-6">
          Welcome back, <span className="font-semibold text-black">{user?.name}</span>!
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h2 className="font-bold text-blue-700">Role</h2>
            <p>{user?.role}</p>
          </div>
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <h2 className="font-bold text-green-700">Email</h2>
            <p>{user?.email}</p>
          </div>
        </div>

        <button 
          onClick={() => navigate('/create-event')}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition font-semibold mr-4 mb-4"
        >
          Create New Event
        </button>

        <button 
          onClick={() => navigate('/events')}
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition font-semibold mr-4 mb-4"
        >
          View All Events
        </button>

        <button 
          onClick={logout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default OrganiserDashboard;