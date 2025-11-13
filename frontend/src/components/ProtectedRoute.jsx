import React from 'react';
import { useAuth } from '../hooks/useAuth'; // <-- ✅ CORRECTED IMPORT PATH
import { Navigate, useLocation } from 'react-router-dom';

/**
 * This component protects routes.
 * 1. If you're not logged in, it redirects you to /signin.
 * 2. If you are logged in, it checks if you have the 'requiredRole'.
 * 3. If you have the wrong role, it redirects you to the homepage.
 */
const ProtectedRoute = ({ element, requiredRole }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="p-8 text-white">Loading...</div>;
  }

  if (!user) {
    // If not logged in, redirect to signin
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  if (requiredRole) {
    // Check for specific roles
    const hasRole = Array.isArray(requiredRole)
      ? requiredRole.some(role => user.role === role)
      : user.role === requiredRole;

    if (!hasRole) {
      // If logged in but wrong role, redirect to home
      return <Navigate to="/" replace />;
    }
  }

  // If all checks pass, render the protected component
  return element;
};

export default ProtectedRoute;