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
import MyRegistrations from './pages/MyRegistrations';
import ManageEvents from './pages/ManageEvents';
import EventEditor from './pages/EventEditor';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import OrganizerEventDetails from './pages/OrganizerEventDetails';
import EventDetails from './pages/EventDetails';
import ParticipantNavbar from './components/ParticipantNavbar';
import OrganisersList from './pages/OrganisersList';
import OrganiserDetail from './pages/OrganiserDetail';
import OrganizerNavbar from './components/OrganizerNavbar';
import OrganizerProfile from './pages/OrganizerProfile';
import AdminNavbar from './components/AdminNavbar';
import ResetRequest from './pages/ResetRequest';
import AdminPasswordRequests from './pages/AdminPasswordRequests';

function App() {
  const { user } = useContext(AuthContext);

  return (
    <>
      {user?.role === 'Organizer' || user?.role === 'organiser' ? (
        <OrganizerNavbar />
      ) : user?.role === 'Admin' || user?.role === 'admin' ? (
        <AdminNavbar />
      ) : (
        <ParticipantNavbar />
      )}

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/request-reset" element={<ResetRequest />} />
        <Route path="/create-event" element={user?.role === 'Organizer' || user?.role === 'organiser' ? <CreateEvent /> : <Navigate to="/login" />} />
        <Route path="/browse" element={<EventFeed />} />
        <Route path="/events/:id" element={<EventDetails />} />

        {/* Organiser Dashboard */}
        <Route path="/organiser-dashboard" element={<OrganiserDashboard />} />

        {/* Organizer Event Details */}
        <Route path="/organizer/events/:id" element={user?.role === 'Organizer' || user?.role === 'organiser' ? <OrganizerEventDetails /> : <Navigate to="/login" />} />

        {/* Manage Events */}
        <Route path="/manage-events" element={<ManageEvents />} />

        {/* Event Editor (Strict Locking) */}
        <Route path="/events/:id/edit" element={user?.role === 'Organizer' || user?.role === 'organiser' ? <EventEditor /> : <Navigate to="/login" />} />

        {/* Admin Dashboard */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />

        {/* Admin Password Resets Dashboard */}
        <Route path="/admin/password-resets" element={user?.role === 'Admin' || user?.role === 'admin' ? <AdminPasswordRequests /> : <Navigate to="/login" />} />

        {/* Participant Dashboard */}
        <Route path="/dashboard" element={<ParticipantDashboard />} />

        {/* Onboarding */}
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Profile */}
        <Route path="/profile" element={user?.role === 'Participant' || user?.role === 'participant' ? <Profile /> : <Navigate to="/login" />} />

        {/* Organisers Listing */}
        <Route path="/organisers" element={user?.role === 'Participant' || user?.role === 'participant' ? <OrganisersList /> : <Navigate to="/login" />} />

        {/* Organiser Detail */}
        <Route path="/organisers/:id" element={user?.role === 'Participant' || user?.role === 'participant' ? <OrganiserDetail /> : <Navigate to="/login" />} />

        {/* My Registrations / Events */}
        <Route path="/my-events" element={user?.role === 'Participant' || user?.role === 'participant' ? <MyRegistrations /> : <Navigate to="/login" />} />

        {/* Organizer Profile */}
        <Route path="/organiser-profile" element={user?.role === 'Organizer' || user?.role === 'organiser' ? <OrganizerProfile /> : <Navigate to="/login" />} />


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
    </>
  );
}

export default App;