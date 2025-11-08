// src/components/Navbar.jsx

import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { LogOut } from 'lucide-react';

const Navbar = ({ pageTitle }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gray-800/80 backdrop-blur-sm p-4 flex justify-between items-center sticky top-0 z-10 border-b border-gray-700">
      <h1 className="text-white text-xl font-bold">{pageTitle || 'Telegram Automation'}</h1>

      <div className="flex items-center">
        {location.pathname !== '/dashboard' && (
          <Link to="/dashboard" className="text-white hover:text-cyan-400 mr-6 transition-colors">
            Dashboard
          </Link>
        )}

        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center"
        >
          <LogOut size={18} className="mr-2" />
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
