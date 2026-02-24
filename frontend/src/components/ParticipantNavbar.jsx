import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

function ParticipantNavbar() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navLinks = [
        { name: 'Dashboard', path: '/dashboard' },
        { name: 'Browse Events', path: '/browse' },
        { name: 'Clubs/Organisers', path: '/organisers' },
        { name: 'Profile', path: '/profile' }
    ];

    // We only want to show this navbar to Participants
    if (!user || (user.role !== 'Participant' && user.role !== 'participant')) {
        return null;
    }

    return (
        <nav className="bg-indigo-600 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/dashboard" className="flex-shrink-0 flex items-center text-white font-bold text-xl tracking-tight">
                            Felicity Portal
                        </Link>
                        <div className="hidden md:ml-10 md:flex md:space-x-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === link.path
                                        ? 'bg-indigo-700 text-white shadow-inner'
                                        : 'text-indigo-100 hover:bg-indigo-500 hover:text-white'
                                        }`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-indigo-100 text-sm hidden sm:block">
                            Hi, <span className="font-semibold text-white">{user.name}</span>
                        </span>
                        <button
                            onClick={handleLogout}
                            className="text-indigo-100 hover:bg-indigo-500 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default ParticipantNavbar;
