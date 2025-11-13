import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth'; // Our new auth hook
import { useNavigate } from 'react-router-dom';

export default function ChangePassword() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { getToken, user } = useAuth(); // Get token and user
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Frontend validation
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const token = getToken();
      if (!token) {
        navigate('/signin');
        return;
      }

      // Call the new protected route we created on the backend
      const res = await fetch('http://localhost:5000/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message);
      }

      alert('Password changed successfully! You will be redirected to your dashboard.');
      
      // Redirect to the correct dashboard based on the user's role
      if (user.role === 'Admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/organizer/dashboard');
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Re-using the login page style */}
      <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-white text-center mb-4">Set Your New Password</h2>
        <p className="text-gray-300 text-center mb-6">You must change your temporary password before you can proceed.</p>
        
        {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-xl mb-4">{error}</div>}
        
        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Old (Temporary) Password</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="input-field" 
              placeholder="Enter your temporary password"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-field"
              placeholder="Enter a new, secure password"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field"
              placeholder="Confirm your new password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-linear-to-r from-green-500 to-emerald-500 text-white py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-300 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Set New Password'}
          </button>
        </div>
      </form>
    </div>
  );
}