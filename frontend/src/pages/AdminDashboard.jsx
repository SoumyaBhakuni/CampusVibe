import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';

// This is the main component
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('requests');
  
  // --- NEW MODAL STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null); // Will hold the request being approved
  // We need to pass the token and a refresh function to the modal
  const { getToken } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0); // A simple way to trigger refresh
  
  // --- END NEW MODAL STATE ---

  // Tab definitions
  const tabs = [
    { id: 'requests', label: 'Event Requests' },
    { id: 'events', label: 'Manage Events' },
    { id: 'users', label: 'Manage Users' },
    { id: 'clubs', label: 'Manage Clubs' },
    { id: 'resources', label: 'Manage Resources' },
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
    setRefreshKey(oldKey => oldKey + 1); // Trigger a refresh of the requests list
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
          {activeTab === 'resources' && <ManageResources />}
        </div>
      </div>
      
      {/* --- NEW MODAL RENDER --- */}
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
// TAB 1: MANAGE EVENT REQUESTS (REFACTORED)
// ===================================================================
// Now accepts onApproveClick and refreshKey as props
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

  // useEffect now depends on refreshKey
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests, refreshKey]);

  // handleApprove is now just a click handler
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
      fetchRequests(); // Re-fetch on reject
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
                  {/* Updated to pass the full request object */}
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
// TAB 2: MANAGE EVENTS (Unchanged from last step)
// ===================================================================
const ManageEvents = () => {
  // ... (Code from previous step)
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
  const handleDeleteEvent = (eventId) => {
    if (!window.confirm("Are you sure you want to permanently delete this event and all its data?")) return;
    alert(`Deleting event ${eventId}... (logic to be built)`);
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
// TAB 3: MANAGE USERS (Unchanged from last step)
// ===================================================================
const ManageUsers = () => {
  // ... (Code from previous step)
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
  const handleRevoke = (userId) => {
    alert(`Revoking access for user ${userId}... (logic to be built)`);
  };
  const handleGrant = (userId) => {
    alert(`Granting access for user ${userId}... (logic to be built)`);
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
// TAB 4: MANAGE CLUBS (Unchanged)
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
// TAB 5: MANAGE RESOURCES (Unchanged)
// ===================================================================
const ManageResources = () => {
  // ... (This component code is unchanged)
  return (
    <div>
      <h2 className="text-2xl font-semibold">Manage Resources</h2>
      <p className="text-gray-400">
        This section will contain the CRUD interface for Resources.
      </p>
    </div>
  );
};


// ===================================================================
// --- NEW MODAL COMPONENT ---
// ===================================================================
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
      onSuccess(); // This closes the modal and refreshes the list
      
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