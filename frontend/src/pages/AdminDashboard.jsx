import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

function AdminDashboard() {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-blue-800 mb-2">Admin Dashboard</h1>
              <p className="text-gray-600">
                Welcome back, <span className="font-semibold text-black">{user?.name}</span>! 
                Manage your event portal efficiently.
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Role: <span className="font-semibold text-blue-700">{user?.role}</span></p>
              <p className="text-sm text-gray-600 mt-1">Email: <span className="font-semibold text-gray-700">{user?.email}</span></p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold">
            Manage Users
          </button>
          <button className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold">
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

export default AdminDashboard;
