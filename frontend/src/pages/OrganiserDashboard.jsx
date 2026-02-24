import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

function OrganiserDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Analytics State
  const [analytics, setAnalytics] = useState({
    totalRegistrations: 0,
    totalSales: 0,
    totalRevenue: 0,
    averageAttendanceRate: 0
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Fetch events via the newly created /api/events/organizer route
  useEffect(() => {
    const fetchEventsAndAnalytics = async () => {
      try {
        setLoading(true);
        const response = await api.get('/events/organizer');
        const data = response.data.events || [];
        setEvents(data);

        // Process Analytics for Completed Events
        const completedEvents = data.filter(e => e.status === 'Completed');
        if (completedEvents.length > 0) {
          setAnalyticsLoading(true);
          let totalRegs = 0;
          let totalSales = 0;
          let totalRevenue = 0;
          let totalAttended = 0;

          // Fetch participants for each completed event to get accurate attendance
          const promises = completedEvents.map(event => api.get(`/events/${event._id}/participants`));
          const participantsResponses = await Promise.allSettled(promises);

          participantsResponses.forEach((res, index) => {
            if (res.status === 'fulfilled') {
              const event = completedEvents[index];
              const registrations = res.value.data.registrations || [];

              const eventRegCount = registrations.length;
              totalRegs += eventRegCount;

              if (event.eventType === 'Merchandise') {
                totalSales += eventRegCount; // Count of merch bought
              }

              const fee = event.fee || 0;
              totalRevenue += (eventRegCount * fee);

              const attendedCount = registrations.filter(r => r.attendanceStatus === 'Present' || r.attendanceStatus === 'Attended').length;
              totalAttended += attendedCount;
            }
          });

          const avgAttendance = totalRegs > 0 ? Math.round((totalAttended / totalRegs) * 100) : 0;

          setAnalytics({
            totalRegistrations: totalRegs,
            totalSales,
            totalRevenue,
            averageAttendanceRate: avgAttendance
          });
          setAnalyticsLoading(false);
        }

      } catch (err) {
        console.error('Failed to load organizer events', err);
        setError('Failed to fetch events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEventsAndAnalytics();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navbar Header (Internal Dashboard) */}
      <header className="bg-white shadow border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Dashboard Overview</h1>
            <p className="text-sm text-gray-500 mt-1">
              Welcome back, <span className="font-bold text-indigo-600">{user?.name || 'Organiser'}</span>
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/create-event')}
              className="bg-indigo-600 text-white hover:bg-indigo-700 font-bold px-5 py-2.5 rounded-xl transition shadow-md flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              Create New Event
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

        {/* High-Level Completed Analytics Section */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            Post-Event Analytics
            <span className="bg-gray-200 text-gray-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ml-2">Completed Events Only</span>
          </h2>

          {analyticsLoading ? (
            <div className="p-8 text-center text-gray-500 bg-white rounded-xl shadow border border-gray-100">Calculating historical data...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:border-indigo-200 transition-colors">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Total Registrations</p>
                  <p className="text-3xl font-black text-gray-900">{analytics.totalRegistrations}</p>
                </div>
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:border-green-200 transition-colors">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-green-600 mb-1">Total Sales (Merch)</p>
                  <p className="text-3xl font-black text-gray-900">{analytics.totalSales}</p>
                </div>
                <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:border-amber-200 transition-colors">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">Total Revenue</p>
                  <p className="text-3xl font-black text-gray-900">₹{analytics.totalRevenue}</p>
                </div>
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:border-purple-200 transition-colors">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-purple-600 mb-1">Avg Attendance</p>
                  <p className="text-3xl font-black text-gray-900">{analytics.averageAttendanceRate}%</p>
                </div>
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Events Carousel / Horizontal List */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
              Your Event Portfolio
            </h2>
            <div className="text-sm font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{events.length} Total Events</div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-200">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          ) : events.length === 0 && !error ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center">
              <div className="mx-auto w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No events created yet</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">Get started by building your first event and tracking the insights here.</p>
              <button
                onClick={() => navigate('/create-event')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition"
              >
                Create New Event
              </button>
            </div>
          ) : (
            <div className="flex overflow-x-auto gap-6 pb-6 snap-x pt-2 px-2 -mx-2 hide-scrollbar">
              {events.map(event => (
                <div key={event._id} className="min-w-[320px] max-w-[320px] bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl transition-all duration-300 flex flex-col snap-center group">
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-gray-900 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
                        {event.eventName || event.title}
                      </h3>
                    </div>

                    <div className="space-y-3 mt-auto">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Status</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded font-black uppercase tracking-wider text-[10px]
                                ${event.status === 'Published' ? 'bg-green-100 text-green-800 border border-green-200' :
                            event.status === 'Draft' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                              event.status === 'Ongoing' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                'bg-gray-100 text-gray-800 border border-gray-200'}`}
                        >
                          {event.status || 'Draft'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Type</span>
                        <span className="text-gray-900 font-semibold">{event.eventType || 'Normal'}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm border-t border-gray-100 pt-3">
                        <span className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Starts</span>
                        <span className="text-indigo-900 font-bold bg-indigo-50 px-2 py-0.5 rounded text-xs">{new Date(event.startDate || event.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
                    <button
                      onClick={() => navigate(`/organizer/events/${event._id}`)}
                      className="w-full bg-white border-2 border-indigo-100 text-indigo-700 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                    >
                      Manage Event
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}

export default OrganiserDashboard;