import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // <-- This is the correct path

export default function Navbar() {
  const { user, logout } = useAuth();

  // --- START OF UPDATED LOGIC ---
  const isEventAdmin = user && user.role === 'EventAdmin';
  const isAcademicAdmin = user && user.role === 'AcademicAdmin';
  // This check is now *only* for Organizers, not Admins
  const isOrganizer = user && user.role.includes('Organizer');
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
          
          {/* --- This logic is now updated --- */}
          {!user && (
            <>
              <NavButton to="/">Home</NavButton>
              <NavButton to="/events">Events</NavButton>
              <NavButton to="/clubs">Clubs</NavButton>
            </>
          )}
          
          {isEventAdmin && <NavButton to="/admin/dashboard">Event Admin</NavButton>}
          {isAcademicAdmin && <NavButton to="/academic/dashboard">Academic Admin</NavButton>}
          {/* This check now correctly uses isOrganizer and won't show for EventAdmin */}
          {isOrganizer && <NavButton to="/organizer/dashboard">My Dashboard</NavButton>}
          {/* --- END OF UPDATED LINKS --- */}
        </ul>
      </div>

      <div className='flex items-center gap-4'>
        {user ? (
          <>
            {/* 3. This is the new conditional logic for the "Add Event" button */}
            {isOrganizer && (
              user.eventCreationLimit > 0 ? (
                <Link 
                  to="/addevent" 
                  className='bg-linear-to-r from-purple-500 to-pink-500 text-white px-5 py-3 rounded-xl font-semibold'
                >
                  Add Event
                </Link>
              ) : (
                <button 
                  className='bg-gray-500 text-gray-300 px-5 py-3 rounded-xl font-semibold cursor-not-allowed'
                  disabled
                  title="You have reached your event creation limit."
                >
                  Add Event
                </button>
              )
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