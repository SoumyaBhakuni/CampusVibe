import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';

// This is the main component
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('requests');

  // Tab definitions
  const tabs = [
    { id: 'requests', label: 'Event Requests' },
    { id: 'users', label: 'Manage Users' },
    { id: 'clubs', label: 'Manage Clubs' },
    { id: 'resources', label: 'Manage Resources' }, // <-- ADDED THIS
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 p-8 text-white">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Event Admin Dashboard</h1> {/* <-- RENAMED */}

        {/* Tab Navigation */}
        <div className="flex space-x-2 mb-6 border-b border-white/10">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-6 font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-purple-400 text-purple-300'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
          {activeTab === 'requests' && <ManageEventRequests />}
          {activeTab === 'users' && <ManageUsers />}
          {activeTab === 'clubs' && <ManageClubs />}
          {activeTab === 'resources' && <ManageResources />} {/* <-- ADDED THIS */}
        </div>
      </div>
    </div>
  );
}

// ===================================================================
// TAB 1: MANAGE EVENT REQUESTS (Unchanged)
// ===================================================================
const ManageEventRequests = () => {
  // ... (This component code is unchanged) ...
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { getToken } = useAuth();
  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const token = getToken();
      const res = await fetch('http://localhost:5000/api/admin/requests', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to fetch requests');
      }
      const data = await res.json();
      setRequests(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);
  const handleApprove = async (requestId) => {
    const eventCreationLimit = prompt("Enter event creation limit for this user:", "1");
    if (!eventCreationLimit || isNaN(eventCreationLimit)) {
      alert("Invalid limit. Approval cancelled.");
      return;
    }
    const accessExpiryDate = prompt("Enter access expiry date (YYYY-MM-DD):", "2025-12-31");
    if (!accessExpiryDate) {
      alert("Invalid date. Approval cancelled.");
      return;
    }
    try {
      const token = getToken();
      const res = await fetch(`http://localhost:5000/api/admin/requests/${requestId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          eventCreationLimit: parseInt(eventCreationLimit, 10), 
          accessExpiryDate 
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to approve request');
      }
      const data = await res.json();
      alert(`Request approved! User account created.\nEmail: ${data.userEmail}\nTemp Password: ${data.tempPassword}`);
      fetchRequests();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };
  const handleReject = async (requestId) => {
    if (!window.confirm("Are you sure you want to reject this request?")) return;
    try {
      const token = getToken();
      const res = await fetch(`http://localhost:5000/api/admin/requests/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to reject request');
      }
      alert('Request rejected.');
      fetchRequests();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Pending Event Requests</h2>
      {loading && <p>Loading requests...</p>}
      {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-xl">{error}</div>}
      {!loading && !error && (
        <div className="space-y-4">
          {requests.length === 0 ? (
            <p className="text-gray-400">No pending requests.</p>
          ) : (
            requests.map(req => (
              <div key={req.id} className="bg-white/5 p-4 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center border border-white/10">
                <div className="mb-4 md:mb-0">
                  <div className="font-semibold text-lg">{req.requestorEmail}</div>
                  <div className="text-sm text-gray-400">
                    Type: <span className="text-purple-300">{req.requestType}</span> | 
                    Scope: <span className="text-purple-300">{req.scope}</span>
                    {req.parentFestId && ` | Parent Fest ID: ${req.parentFestId}`}
                    {req.requestedEventCount > 1 && ` | Events Requested: ${req.requestedEventCount}`}
                  </div>
                  <p className="text-sm text-gray-300 mt-1">Details: {req.eventDetails || 'N/A'}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => handleApprove(req.id)} className="admin-button-green">Approve</button>
                  <button onClick={() => handleReject(req.id)} className="admin-button-red">Reject</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ===================================================================
// TAB 2: MANAGE USERS (Unchanged)
// ===================================================================
const ManageUsers = () => {
  // ... (This component code is unchanged) ...
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getToken } = useAuth();
  const fetchUsers = useCallback(async () => {
    setUsers([
      { id: 1, email: "your-first-user@example.com", role: "Admin", accessExpiryDate: null },
      { id: 2, email: "organizer@test.com", role: "Organizer", accessExpiryDate: "2025-12-31" },
      { id: 3, email: "expired@test.com", role: "Guest", accessExpiryDate: "2024-01-01" },
    ]);
    setLoading(false);
  }, [getToken]);
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  const handleReactivate = (userId) => {
    alert(`Re-activating user ${userId}... (logic to be built)`);
  };
  const handleRevoke = (userId) => {
    alert(`Revoking access for user ${userId}... (logic to be built)`);
  };
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Manage Users</h2>
      {loading ? <p>Loading users...</p> : (
        <div className="space-y-4">
          {users.map(user => (
            <div key={user.id} className="bg-white/5 p-4 rounded-lg flex justify-between items-center border border-white/10">
              <div>
                <div className="font-semibold text-lg">{user.email}</div>
                <div className={`text-sm ${user.role === 'Guest' ? 'text-red-400' : 'text-green-400'}`}>
                  Role: {user.role} | 
                  Expires: {user.accessExpiryDate ? new Date(user.accessExpiryDate).toLocaleDateString() : 'Never'}
                </div>
              </div>
              <div className="flex gap-2">
                {user.role === 'Guest' ? (
                  <button onClick={() => handleReactivate(user.id)} className="admin-button-green">Re-activate</button>
                ) : (
                  <button onClick={() => handleRevoke(user.id)} className="admin-button-red">Revoke Access</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ===================================================================
// TAB 3: MANAGE CLUBS (Unchanged)
// ===================================================================
const ManageClubs = () => {
  // ... (This component code is unchanged) ...
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getToken } = useAuth();
  const fetchClubs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/clubs');
      const data = await res.json();
      setClubs(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);
  const handleCreateClub = async () => {
    const clubName = prompt("Enter new club name:");
    const clubDescription = prompt("Enter club description:");
    if (!clubName) return;
    try {
      const token = getToken();
      await fetch('http://localhost:5000/api/admin/clubs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ clubName, clubDescription }),
      });
      fetchClubs();
    } catch (err) {
      alert("Error creating club");
    }
  };
  const handleDeleteClub = async (clubId) => {
    if (!window.confirm("Are you sure you want to delete this club?")) return;
    try {
      const token = getToken();
      alert(`Deleting club ${clubId}... (logic to be built)`);
    } catch (err) {
      alert("Error deleting club");
    }
  };
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Manage Clubs</h2>
      <button onClick={handleCreateClub} className="admin-button-green mb-4">
        + Add New Club
      </button>
      {loading ? <p>Loading clubs...</p> : (
        <div className="space-y-4">
          {clubs.map(club => (
            <div key={club.clubId} className="bg-white/5 p-4 rounded-lg flex justify-between items-center border border-white/10">
              <div>
                <div className="font-semibold text-lg">{club.clubName}</div>
                <div className="text-sm text-gray-400">{club.clubDescription}</div>
              </div>
              <button onClick={() => handleDeleteClub(club.clubId)} className="admin-button-red">Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ===================================================================
// TAB 4: MANAGE RESOURCES (NEW)
// ===================================================================
const ManageResources = () => {
  // This is a placeholder. We will build this out.
  return (
    <div>
      <h2 className="text-2xl font-semibold">Manage Resources</h2>
      <p className="text-gray-400">
        This section will contain the CRUD interface for Resources.
      </p>
    </div>
  );
};