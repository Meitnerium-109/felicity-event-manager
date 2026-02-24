import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const OrganizerNavbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-indigo-700 shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">

                    {/* Logo and primary links */}
                    <div className="flex items-center">
                        <Link to="/organiser-dashboard" className="flex-shrink-0 flex items-center gap-2">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center font-bold text-indigo-700">
                                O
                            </div>
                            <span className="font-bold text-xl text-white tracking-tight">Organiser Portal</span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden sm:flex sm:items-center sm:space-x-8">
                        <Link to="/organiser-dashboard" className="text-indigo-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                            Dashboard
                        </Link>
                        <Link to="/create-event" className="text-indigo-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                            Create Event
                        </Link>
                        <Link to="/manage-events" className="text-indigo-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                            Ongoing Events
                        </Link>
                        <Link to="/organiser-profile" className="text-indigo-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                            Profile
                        </Link>

                        <div className="border-l border-indigo-500 h-6 mx-2"></div>

                        <button
                            onClick={handleLogout}
                            className="bg-indigo-800 hover:bg-indigo-900 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-colors border border-indigo-600"
                        >
                            Logout
                        </button>
                    </div>

                    {/* Mobile menu button */}
                    <div className="flex items-center sm:hidden">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-indigo-200 hover:text-white hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                        >
                            <span className="sr-only">Open main menu</span>
                            {isMobileMenuOpen ? (
                                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            ) : (
                                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {isMobileMenuOpen && (
                <div className="sm:hidden bg-indigo-800 px-2 pt-2 pb-3 space-y-1 shadow-inner">
                    <Link to="/organiser-dashboard" className="text-indigo-100 hover:text-white hover:bg-indigo-600 block px-3 py-2 rounded-md text-base font-medium">Dashboard</Link>
                    <Link to="/create-event" className="text-indigo-100 hover:text-white hover:bg-indigo-600 block px-3 py-2 rounded-md text-base font-medium">Create Event</Link>
                    <Link to="/manage-events" className="text-indigo-100 hover:text-white hover:bg-indigo-600 block px-3 py-2 rounded-md text-base font-medium">Ongoing Events</Link>
                    <Link to="/organiser-profile" className="text-indigo-100 hover:text-white hover:bg-indigo-600 block px-3 py-2 rounded-md text-base font-medium">Profile</Link>
                    <button onClick={handleLogout} className="text-red-300 hover:text-white hover:bg-red-600 block w-full text-left px-3 py-2 rounded-md text-base font-medium mt-4">Logout</button>
                </div>
            )}
        </nav>
    );
};

export default OrganizerNavbar;
