import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext'; // Import the context object

/**
 * This file exports ONLY the provider component.
 * It contains all the logic for login, logout, and state.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // On app load, check localStorage for an existing user
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // --- Login Function ---
  const login = async (email, password) => {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    const userData = {
      email: data.email,
      role: data.role,
      token: data.token,
      eventCreationLimit: data.eventCreationLimit, // <-- ADDED THIS LINE
    };
    localStorage.setItem('user', JSON.stringify(userData));

    // --- NEW ROLE-BASED REDIRECTION ---
    if (data.mustChangePassword) {
      navigate('/change-password');
    } else if (data.role === 'EventAdmin') { // <-- UPDATED
      navigate('/admin/dashboard');
    } else if (data.role === 'AcademicAdmin') { // <-- NEW
      navigate('/academic/dashboard');
    } else if (data.role.includes('Organizer')) {
      navigate('/organizer/dashboard');
    } else {
      navigate('/'); // This is what's happening to your 'Admin' role
    }
  };

  // --- Logout Function ---
  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/signin');
  };
  
  // --- GetToken Function ---
  const getToken = () => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser).token : null;
  };

  const value = { user, loading, login, logout, getToken };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
