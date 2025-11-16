import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';

// This is the main component
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('requests');
  
  // --- NEW MODAL STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null); 
  const { getToken } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0); 
  // --- END NEW MODAL STATE ---

  // Tab definitions (RESOURCES TAB REMOVED)
  const tabs = [
    { id: 'requests', label: 'Event Requests' },
    { id: 'events', label: 'Manage Events' },
    { id: 'users', label: 'Manage Users' },
    { id: 'clubs', label: 'Manage Clubs' },
  ];
  
  const handleOpenModal = (request) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };
  
  const handleApprovalSuccess = () => {
    setRefreshKey(oldKey => oldKey + 1); 
    handleCloseModal();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 p-8 text-white">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Event Admin Dashboard</h1>

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
          {activeTab === 'requests' && (
            <ManageEventRequests 
              onApproveClick={handleOpenModal} 
              refreshKey={refreshKey} 
            />
          )}
          {activeTab === 'events' && <ManageEvents />}
          {activeTab === 'users' && <ManageUsers />}
          {activeTab === 'clubs' && <ManageClubs />}
          {/* ManageResources is no longer here */}
        </div>
      </div>
      
      {/* --- MODAL RENDER --- */}
      {isModalOpen && selectedRequest && (
        <ApprovalModal
          request={selectedRequest}
          onClose={handleCloseModal}
          onSuccess={handleApprovalSuccess}
          getToken={getToken}
        />
      )}
    </div>
  );
}

// ===================================================================
// TAB 1: MANAGE EVENT REQUESTS (Unchanged)
// ===================================================================
const ManageEventRequests = ({ onApproveClick, refreshKey }) => {
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
  }, [fetchRequests, refreshKey]);

  const handleApprove = (request) => {
    onApproveClick(request);
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
                  <button onClick={() => handleApprove(req)} className="admin-button-green">Approve</button>
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
// TAB 2: MANAGE EVENTS (Unchanged)
// ===================================================================
const ManageEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { getToken } = useAuth();
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = getToken();
      const res = await fetch('http://localhost:5000/api/admin/events', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to fetch events');
      }
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);
  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Are you sure you want to permanently delete this event and all its data?")) return;
    try {
      const token = getToken();
      const res = await fetch(`http://localhost:5000/api/admin/events/${eventId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to delete event');
      }
      alert('Event deleted successfully.');
      fetchEvents(); 
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Manage All Events</h2>
      {loading && <p>Loading events...</p>}
      {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-xl">{error}</div>}
      {!loading && !error && (
        <div className="space-y-4">
          {events.length === 0 ? (
            <p className="text-gray-400">No events found in the system.</p>
          ) : (
            events.map(event => (
              <div key={event.id} className="bg-white/5 p-4 rounded-lg flex justify-between items-center border border-white/10">
                <div>
                  <div className="font-semibold text-lg">{event.eventName}</div>
                  <div className="text-sm text-gray-400">
                    Organizer: <span className="text-purple-300">{event.Organizer?.email || 'N/A'}</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    Date: {new Date(event.startTime).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleDeleteEvent(event.id)} className="admin-button-red">Delete</button>
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
// TAB 3: MANAGE USERS (Unchanged)
// ===================================================================
const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { getToken } = useAuth();
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = getToken();
      const res = await fetch('http://localhost:5000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to fetch users');
      }
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  const updateRole = async (userId, newRole) => {
    try {
      const token = getToken();
      const res = await fetch(`http://localhost:5000/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || `Failed to set role to ${newRole}`);
      }
      alert(`User role set to ${newRole}.`);
      fetchUsers(); // Refresh list
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };
  
  const handleRevoke = (userId) => {
    if (window.confirm("Are you sure you want to revoke access? This sets the role to 'Guest'.")) {
      updateRole(userId, 'Guest');
    }
  };
  const handleGrant = (userId) => {
    if (window.confirm("Grant default 'Organizer' access?")) {
      updateRole(userId, 'Organizer');
    }
  };
  
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Manage Users</h2>
      {loading && <p>Loading users...</p>}
      {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-xl">{error}</div>}
      {!loading && !error && (
        <div className="space-y-4">
          {users.length === 0 ? (
            <p className="text-gray-400">No users found.</p>
          ) : (
            users.map(user => (
              <div key={user.id} className="bg-white/5 p-4 rounded-lg flex justify-between items-center border border-white/10">
                <div>
                  <div className="font-semibold text-lg">{user.email}</div>
                  <div className={`text-sm ${
                    user.role === 'Guest' ? 'text-red-400' : 
                    user.role === 'EventAdmin' ? 'text-purple-300' : 
                    user.role === 'AcademicAdmin' ? 'text-blue-300' : 'text-green-400'
                  }`}>
                    Role: {user.role} | 
                    Expires: {user.accessExpiryDate ? new Date(user.accessExpiryDate).toLocaleDateString() : 'Never'}
                  </div>
                </div>
                <div className="flex gap-2">
                  {user.role === 'Guest' ? (
                    <button onClick={() => handleGrant(user.id)} className="admin-button-green">Grant Access</button>
                  ) : (
                    <button onClick={() => handleRevoke(user.id)} className="admin-button-red">Revoke Access</button>
                  )}
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
// TAB 4: MANAGE CLUBS (Fixed for String ID)
// ===================================================================
const ManageClubs = () => {
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
    const clubId = prompt("Enter new unique Club ID (e.g., 'C001'):");
    if (!clubId || clubId.trim() === '') return; 
    
    const clubName = prompt("Enter new club name:");
    const clubDescription = prompt("Enter club description (optional):");
    if (!clubName || clubName.trim() === '') return;
    
    try {
      const token = getToken();
      const res = await fetch('http://localhost:5000/api/admin/clubs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ clubId, clubName, clubDescription }), 
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to create club');
      }
      
      alert('Club created successfully.');
      fetchClubs();
    } catch (err) {
      alert(`Error creating club: ${err.message}`);
    }
  };
  
  const handleDeleteClub = async (clubId) => {
    if (!window.confirm(`Are you sure you want to permanently delete club ${clubId} and all associated events?`)) return;
    try {
      const token = getToken();
      const res = await fetch(`http://localhost:5000/api/admin/clubs/${clubId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to delete club');
      }
      
      alert('Club deleted successfully.');
      fetchClubs();
    } catch (err) {
      alert(`Error deleting club: ${err.message}`);
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
                <div className="font-semibold text-lg">{club.clubName} (ID: {club.clubId})</div> 
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
// TAB 1: MANAGE EVENT REQUESTS (Unchanged)
// TAB 2: MANAGE EVENTS (Unchanged)
// TAB 3: MANAGE USERS (Unchanged)
// TAB 4: MANAGE CLUBS (Modified above)
// ===================================================================

// --- MODAL COMPONENT (Unchanged) ---
const ApprovalModal = ({ request, onClose, onSuccess, getToken }) => {
  const [limit, setLimit] = useState(request.requestedEventCount || 1);
  const [expiry, setExpiry] = useState('2025-12-31');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (isNaN(limit) || limit <= 0) {
      setError('Invalid event limit.');
      setSubmitting(false);
      return;
    }
    if (!expiry) {
      setError('Expiry date is required.');
      setSubmitting(false);
      return;
    }

    try {
      const token = getToken();
      const res = await fetch(`http://localhost:5000/api/admin/requests/${request.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          eventCreationLimit: parseInt(limit, 10), 
          accessExpiryDate: expiry 
        }),
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to approve request');
      }
      
      const data = await res.json();
      alert(`Request approved! User account created.\nEmail: ${data.userEmail}\nTemp Password: ${data.tempPassword}`);
      onSuccess(); 
      
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md" 
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 w-full max-w-lg rounded-2xl border border-purple-500/50 p-6 shadow-xl" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-semibold">Approve Request</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-gray-300">
            Approving request for: <span className="font-semibold text-white">{request.requestorEmail}</span>
          </p>
          
          {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-xl">{error}</div>}

          <div>
            <label className="block text-gray-300 font-medium mb-2">Event Creation Limit</label>
            <input 
              type="number"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="input-field"
              min="1"
            />
          </div>
          
          <div>
            <label className="block text-gray-300 font-medium mb-2">Access Expiry Date</label>
            <input 
              type="date"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              className="input-field"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="admin-button bg-white/10 text-white"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={submitting} 
              className="admin-button-green"
            >
              {submitting ? 'Approving...' : 'Approve & Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};