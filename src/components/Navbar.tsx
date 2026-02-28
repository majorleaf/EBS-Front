import { Link, useNavigate } from 'react-router-dom';
import { Calendar, User, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';

export function Navbar() {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/events" className="flex items-center">
            <Calendar className="text-blue-600 mr-2" size={28} />
            <span className="text-2xl font-bold text-gray-900">EventBook</span>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link to="/events">
                  <Button variant="ghost" size="sm">
                    Events
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm">
                    <User size={18} className="mr-1" />
                    My Bookings
                  </Button>
                </Link>
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="ghost" size="sm">
                      <LayoutDashboard size={18} className="mr-1" />
                      Admin
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut size={18} className="mr-1" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="primary" size="sm">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
