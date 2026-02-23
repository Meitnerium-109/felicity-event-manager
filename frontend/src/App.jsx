import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateEvent from './pages/CreateEvent';
import EventFeed from './pages/EventFeed';
import OrganiserDashboard from './pages/OrganiserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ParticipantDashboard from './pages/ParticipantDashboard';

function App() {
  const { user } = useContext(AuthContext);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/create-event" element={<CreateEvent />} />
      <Route path="/events" element={<EventFeed />} />
      
      {/* Organiser Dashboard */}
      <Route path="/organiser-dashboard" element={<OrganiserDashboard />} />
      
      {/* Admin Dashboard */}
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      
      {/* Participant Dashboard */}
      <Route path="/dashboard" element={<ParticipantDashboard />} />
      
      {/* Home Route */}
      <Route path="/" element={
        user ? (
          <Navigate to={
            user?.role === 'Admin' ? '/admin-dashboard' : 
            user?.role === 'Organizer' ? '/organiser-dashboard' : 
            '/dashboard'
          } replace />
        ) : (
          <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-10 rounded-lg shadow-md text-center">
              <h1 className="text-3xl font-bold text-blue-600 mb-6">Welcome to Felicity Portal</h1>
              <p className="text-gray-600 mb-8">An amazing platform for discovering and managing events.</p>
              <Link 
                to="/login" 
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition font-semibold"
              >
                Go to Login
              </Link>
            </div>
          </div>
        )
      } />
    </Routes>
  );
}

export default App;