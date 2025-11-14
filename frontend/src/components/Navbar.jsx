import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // <-- This should be hooks/useAuth

export default function Navbar() {
  const { user, logout } = useAuth();

  // --- START OF UPDATED LOGIC ---
  const isEventAdmin = user && user.role === 'EventAdmin';
  const isAcademicAdmin = user && user.role === 'AcademicAdmin';
  const canOrganize = user && (user.role.includes('Organizer') || isEventAdmin);
  // --- END OF UPDATED LOGIC ---

  return (
    <nav className='flex items-center px-8 py-4 bg-slate-900/80 backdrop-blur-lg border-b border-white/10 justify-between sticky top-0 z-50'>
      <div className='flex items-center'>
        <Link to="/" className='text-2xl font-bold bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent'>
          CampusVibe
        </Link>
      </div>

      <div className='flex items-center'>
        <ul className='flex gap-2 items-center bg-white/5 backdrop-blur-lg rounded-2xl p-1 border border-white/10'>
          <NavButton to="/">Home</NavButton>
          <NavButton to="/events">Events</NavButton>
          <NavButton to="/clubs">Clubs</NavButton>
          
          {/* --- START OF UPDATED LINKS --- */}
          {isEventAdmin && <NavButton to="/admin/dashboard">Event Admin</NavButton>}
          {isAcademicAdmin && <NavButton to="/academic/dashboard">Academic Admin</NavButton>}
          {canOrganize && <NavButton to="/organizer/dashboard">My Dashboard</NavButton>}
          {/* --- END OF UPDATED LINKS --- */}
        </ul>
      </div>

      <div className='flex items-center gap-4'>
        {user ? (
          <>
            {canOrganize && (
              <Link to="/addevent" className='bg-linear-to-r from-purple-500 to-pink-500 text-white px-5 py-3 rounded-xl font-semibold'>
                Add Event
              </Link>
            )}
            <button onClick={logout} className='text-gray-300 hover:text-white'>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/request-event" className='bg-white/10 text-white px-5 py-3 rounded-xl font-semibold'>
              Organize an Event
            </Link>
            <Link to="/signin" className='bg-linear-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold'>
              Sign In
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

// Helper component
const NavButton = ({ to, children }) => (
  <li>
    <NavLink
      to={to}
      className={({ isActive }) =>
        `font-medium py-3 px-6 rounded-xl ${isActive ? 'bg-linear-to-r from-purple-500 to-pink-500 text-white' : 'text-gray-300 hover:text-white'}`
      }
    >
      {children}
    </NavLink>
  </li>
);