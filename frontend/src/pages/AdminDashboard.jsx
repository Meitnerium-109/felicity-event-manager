import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

function AdminDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('users'); // 'users', 'events', 'create-organiser'

  // Data states
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Organiser Form States
  const [orgFormData, setOrgFormData] = useState({
    name: '',
    contactNumber: '',
    description: '',
    category: 'Technical',
    collegeName: 'IIIT Hyderabad'
  });
  const [orgFormLoading, setOrgFormLoading] = useState(false);
  const [orgFormError, setOrgFormError] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState(null); // { loginEmail, plainPassword }

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'users') {
        const res = await api.get('/admin/users');
        const data = res.data.data !== undefined ? res.data.data : (res.data.users || res.data);
        setUsers(Array.isArray(data) ? data : []);
      } else if (activeTab === 'events') {
        const res = await api.get('/events');
        const data = res.data.data !== undefined ? res.data.data : (res.data.events || res.data);
        setEvents(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(`Error fetching ${activeTab}:`, err);
      setError(err.response?.data?.message || `Failed to load ${activeTab}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users' || activeTab === 'events') {
      fetchData();
    }
  }, [activeTab]);

  // Handlers for Tables
  const handleDeleteUser = async (u) => {
    if (u._id === user._id) {
      alert("You cannot delete your own admin account.");
      return;
    }

    if (window.confirm(`Are you sure you want to PERMANENTLY delete ${u.role} ${u.name || u.email}? This action will cascade and DESTROY ALL THEIR EVENTS. This cannot be undone.`)) {
      try {
        if (u.role === 'Organizer' || u.role === 'organiser') {
          // Trigger cascading wipe route
          await api.delete(`/admin/organizers/${u._id}`);
        } else {
          await api.delete(`/admin/users/${u._id}`);
        }
        setUsers(prev => prev.filter(userObj => userObj._id !== u._id));
      } catch (err) {
        console.error('Error deleting user:', err);
        alert(err.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const handleToggleAccess = async (userId, currentStatus) => {
    if (window.confirm(`Are you sure you want to ${currentStatus ? 'block' : 'unblock'} this organizer's access?`)) {
      try {
        const res = await api.put(`/admin/organizers/${userId}/toggle-status`);
        setUsers(prev => prev.map(u =>
          u._id === userId ? { ...u, isActive: res.data.isActive } : u
        ));
      } catch (err) {
        console.error('Error toggling status:', err);
        alert(err.response?.data?.message || 'Failed to toggle status');
      }
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      try {
        await api.delete(`/events/${eventId}`);
        setEvents(prev => prev.filter(e => e._id !== eventId));
      } catch (err) {
        console.error('Error deleting event:', err);
        alert(err.response?.data?.message || 'Failed to delete event');
      }
    }
  };

  // Handlers for Organiser Creation
  const handleOrgChange = (e) => {
    setOrgFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreateOrganiser = async (e) => {
    e.preventDefault();
    setOrgFormLoading(true);
    setOrgFormError('');
    setCreatedCredentials(null);

    try {
      const res = await api.post('/admin/organizers', orgFormData);

      setCreatedCredentials({
        loginEmail: res.data.credentials.loginEmail,
        plainPassword: res.data.credentials.plainPassword
      });

      // Reset form (no email anymore)
      setOrgFormData({
        name: '',
        contactNumber: '',
        description: '',
        category: 'Technical',
        collegeName: 'IIIT Hyderabad'
      });

    } catch (err) {
      console.error('Creation failed:', err);
      setOrgFormError(err.response?.data?.message || 'Failed to create Organiser');
    } finally {
      setOrgFormLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header and Navbar */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Admin Portal</h1>
            <p className="text-sm text-gray-500 mt-1">Logged in as {user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Navigation Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('users')}
              className={`${activeTab === 'users'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-colors`}
            >
              Manage Users
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`${activeTab === 'events'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-colors`}
            >
              Manage Events
            </button>
            <button
              onClick={() => setActiveTab('create-organiser')}
              className={`${activeTab === 'create-organiser'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-colors flex items-center gap-2`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Provision Organiser
            </button>
          </nav>
        </div>

        {/* Error State */}
        {error && activeTab !== 'create-organiser' && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className={`${activeTab === 'create-organiser' ? '' : 'bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200'}`}>

          {loading && activeTab !== 'create-organiser' ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          ) : activeTab === 'users' ? (

            /* USERS TABLE */
            <div className="overflow-x-auto pb-4">
              {users.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No users found.</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((u) => (
                      <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{u.name || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{u.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                            ${u.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                              u.role === 'Organizer' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(u.role === 'Organizer' || u.role === 'organiser') ? (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                              ${u.isActive !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                              {u.isActive !== false ? 'Active' : 'Blocked'}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs italic">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2">
                          {(u.role === 'Organizer' || u.role === 'organiser') && (
                            <button
                              onClick={() => handleToggleAccess(u._id, u.isActive !== false)}
                              className={`px-3 py-1.5 rounded-md transition-colors ${u.isActive !== false ? 'text-amber-700 bg-amber-50 hover:bg-amber-100' : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'}`}
                              title={u.isActive !== false ? "Archive Organiser (Block Login)" : "Unarchive Organiser (Allow Login)"}
                            >
                              {u.isActive !== false ? 'Archive (Block)' : 'Unarchive (Unblock)'}
                            </button>
                          )}

                          {u._id !== user._id && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition-colors"
                              title="Permanently Delete (Cascades Events)"
                            >
                              Delete Permanently
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

          ) : activeTab === 'events' ? (

            /* EVENTS TABLE */
            <div className="overflow-x-auto pb-4">
              {events.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No events found.</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Event Title</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Organiser</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {events.map((e) => (
                      <tr key={e._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-[250px]" title={e.eventName || e.title}>{e.eventName || e.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{e.category || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{e.organiserId?.name || e.organiserId?.email || 'Unknown'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {(e.startDate || e.date) ? new Date(e.startDate || e.date).toLocaleDateString() : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2">
                          <button
                            onClick={() => navigate(`/events/${e._id}`)}
                            className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-md transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(e._id)}
                            className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition-colors"
                          >
                            Delete Event
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

          ) : (

            /* CREATE ORGANISER FORM */
            <div className="max-w-2xl mx-auto py-4">
              <div className="bg-white shadow sm:rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-5">Provision New Organiser Account</h3>

                  {createdCredentials ? (
                    <div className="bg-green-50 border border-green-200 rounded-md p-6 mb-6">
                      <div className="flex items-center mb-4">
                        <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h4 className="text-xl font-bold text-green-800">Account Created Successfully!</h4>
                      </div>
                      <p className="text-sm text-green-700 mb-4">Please securely copy and share these credentials with the club representative. The password cannot be recovered later.</p>

                      <div className="bg-white rounded border border-green-200 overflow-hidden font-mono text-sm">
                        <div className="grid grid-cols-3 border-b border-green-100">
                          <div className="col-span-1 bg-green-50 p-3 text-green-800 font-semibold border-r border-green-100">Login Email</div>
                          <div className="col-span-2 p-3 text-gray-900 break-all">{createdCredentials.loginEmail}</div>
                        </div>
                        <div className="grid grid-cols-3">
                          <div className="col-span-1 bg-green-50 p-3 text-green-800 font-semibold border-r border-green-100">Temporary Password</div>
                          <div className="col-span-2 p-3 text-gray-900 font-bold tracking-widest">{createdCredentials.plainPassword}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => setCreatedCredentials(null)}
                        className="mt-5 w-full bg-green-600 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Create Another Organiser
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleCreateOrganiser}>
                      <div className="grid grid-cols-6 gap-6">

                        <div className="col-span-6 sm:col-span-3">
                          <label className="block text-sm font-medium text-gray-700">Club / Organiser Name</label>
                          <input type="text" name="name" required value={orgFormData.name} onChange={handleOrgChange} className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>

                        <div className="col-span-6 sm:col-span-3">
                          <label className="block text-sm font-medium text-gray-700">Category</label>
                          <select name="category" required value={orgFormData.category} onChange={handleOrgChange} className="mt-1 block w-full p-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                            <option value="Technical">Technical</option>
                            <option value="Cultural">Cultural</option>
                            <option value="Sports">Sports</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div className="col-span-6">
                          <label className="block text-sm font-bold text-gray-700 mb-2">Notice on Login Credentials</label>
                          <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md border border-gray-200">
                            The Login Email will be automatically generated as <span className="font-mono text-indigo-600 font-bold">name-iiit@clubs.iiit.ac.in</span>. A secure temporary password will also be automatically generated and displayed on the next screen.
                          </p>
                        </div>

                        <div className="col-span-6 sm:col-span-3">
                          <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                          <input type="tel" name="contactNumber" required value={orgFormData.contactNumber} onChange={handleOrgChange} className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>

                        <div className="col-span-6">
                          <label className="block text-sm font-medium text-gray-700">Description</label>
                          <textarea name="description" rows={3} value={orgFormData.description} onChange={handleOrgChange} className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Give a brief description of the club operations..."></textarea>
                        </div>
                      </div>

                      {orgFormError && (
                        <div className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded">
                          {orgFormError}
                        </div>
                      )}

                      <div className="mt-6 flex justify-end">
                        <button
                          type="submit"
                          disabled={orgFormLoading}
                          className="bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60"
                        >
                          {orgFormLoading ? 'Provisioning...' : 'Provision Organiser'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>

          )}

        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
