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
      id: data.id, // <--- NEW: Store the user's database ID
      email: data.email,
      role: data.role,
      token: data.token,
      eventCreationLimit: data.eventCreationLimit,
    };
    
    // 1. Set localStorage IMMEDIATELY
    localStorage.setItem('user', JSON.stringify(userData));

    // 2. Update React State
    setUser(userData); 

    // 3. Determine redirect path
    let redirectPath;
    if (data.mustChangePassword) {
      redirectPath = '/change-password';
    } else if (data.role === 'EventAdmin') {
      redirectPath = '/admin/dashboard';
    } else if (data.role === 'AcademicAdmin') {
      redirectPath = '/academic/dashboard';
    } else if (data.role.includes('Organizer')) {
      redirectPath = '/organizer/dashboard';
    } else {
      redirectPath = '/';
    }
    
    // 4. Defer navigation
    setTimeout(() => {
        navigate(redirectPath, { replace: true });
    }, 0);
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