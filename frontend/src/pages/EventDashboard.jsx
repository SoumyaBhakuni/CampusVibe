import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // ✅ CORRECTED IMPORT PATH
import NotFound from './NotFound';

// This is the main "Unified Event Dashboard" component
export default function EventDashboard() {
  const [event, setEvent] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeModal, setActiveModal] = useState(null); // 'payments', 'team', 'leaderboard'
  
  const { id } = useParams();
  const { user, getToken } = useAuth(); // This will now work
  const navigate = useNavigate();

  // --- 1. DATA FETCHING ---
  const fetchEventAndLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const eventRes = await fetch(`http://localhost:5000/api/events/${id}`);
      if (!eventRes.ok) {
        const errData = await eventRes.json();
        throw new Error(errData.message || 'Event not found');
      }
      const eventData = await eventRes.json();
      setEvent(eventData);

      if (eventData.hasLeaderboard) {
        // We will assume a new backend route: GET /api/events/:id/leaderboard
        // For now, we'll mock it
        setLeaderboard([
          { id: 1, rank: 1, competitorId: 'Team A', competitorType: 'Team', marks: 950 },
          { id: 2, rank: 2, competitorId: 'Team B', competitorType: 'Team', marks: 920 },
        ]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEventAndLeaderboard();
  }, [fetchEventAndLeaderboard]);

  // --- 2. ROLE & PERMISSION LOGIC ---
  const isOwner = user && event && event.Organizer && 
                  (user.role === 'Admin' || user.email === event.Organizer.email);

  // --- 3. ORGANIZER ACTION HANDLERS ---
  const handleDeleteEvent = async () => {
    if (!window.confirm("Are you sure? This will delete all associated teams, participants, and leaderboard data. This action cannot be undone.")) return;
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`http://localhost:5000/api/events/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to delete event');
      }
      alert('Event deleted successfully.');
      navigate('/events');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };
  
  const handleSendAttendance = async () => {
    if (!window.confirm("This will find all students who attended and were checked in, cross-reference the timetable, and email all conflicting faculty. Are you sure?")) return;
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`http://localhost:5000/api/attendance/${id}/send-attendance`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert(data.message);
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- 4. MAIN RENDER ---
  if (loading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8 text-white"><h2 className="text-2xl">Loading Event...</h2></div>;
  }
  if (error) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8 text-white"><h2 className="text-2xl text-red-400">{error}</h2></div>;
  }
  if (!event) {
    return <NotFound />; 
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* --- Event Header --- */}
        <div className="relative mb-8 p-8 md:p-12 rounded-3xl overflow-hidden border border-white/10 bg-black/20">
          <img src={event.bannerUrl ? `http://localhost:5000${event.bannerUrl}` : 'https://images.unsplash.com/photo-1511578314322-379afb476865'} alt="Event Banner" className="absolute top-0 left-0 w-full h-full object-cover opacity-30 blur-sm"/>
          <div className="relative z-10">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">{event.eventName}</h1>
            <p className="text-xl text-gray-300 max-w-3xl">{event.eventDesc}</p>
            <div className="flex flex-wrap gap-4 mt-6">
              <Link to={`/events/${id}/register`} className="bg-linear-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-xl font-semibold text-lg hover:scale-105 transition-transform">
                Register Now
              </Link>
              <Link to="/events" className="bg-white/10 text-white px-8 py-3 rounded-xl font-semibold hover:bg-white/20 transition-all">
                Explore More Events
              </Link>
            </div>
          </div>
        </div>
        
        {/* --- Organizer/Admin ONLY Control Panel --- */}
        {isOwner && (
          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/10 mb-8">
            <h3 className="text-2xl font-semibold mb-4 text-purple-300">Organizer Admin Panel</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Link to={`/resources/${id}`} className="admin-button">Request Resources</Link>
              <button onClick={() => setActiveModal('payments')} className="admin-button">Verify Payments</button>
              <button onClick={() => setActiveModal('team')} className="admin-button">Manage Team</button>
              <button onClick={() => setActiveModal('leaderboard')} className="admin-button">Manage Leaderboard</button>
              <button onClick={handleSendAttendance} className="admin-button">Send Attendance</button>
              <button onClick={handleDeleteEvent} className="admin-button bg-red-800/50 text-red-300 hover:bg-red-800/70">Delete Event</button>
            </div>
          </div>
        )}

        {/* --- Public Details Grid --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Event Info */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <h3 className="text-2xl font-semibold mb-4">Event Details</h3>
              <div className="space-y-3 text-gray-300">
                <p><strong>Date:</strong> {new Date(event.startTime).toLocaleString()} to {new Date(event.endTime).toLocaleString()}</p>
                <p><strong>Venue:</strong> {event.venue}</p>
                <p><strong>Type:</strong> {event.registrationType} ({event.isPaidEvent ? 'Paid' : 'Free'})</p>
                <p><strong>Organizing Club:</strong> {event.Club ? event.Club.clubName : 'N/A'}</p>
              </div>
            </div>

            {/* Leaderboard (Public) */}
            {event.hasLeaderboard && (
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <h3 className="text-2xl font-semibold mb-4">Leaderboard</h3>
                <table className="w-full text-left">
                  <thead><tr className="border-b border-white/10"><th className="p-3">Rank</th><th className="p-3">Team / Participant</th>{event.showLeaderboardMarks && <th className="p-3 text-right">Marks</th>}</tr></thead>
                  <tbody>
                    {leaderboard.map((item) => (
                      <tr key={item.id} className="border-b border-white/5">
                        <td className="p-3 text-2xl font-bold text-purple-300">{item.rank}</td>
                        <td className="p-3 text-lg">{item.competitorId}</td>
                        {event.showLeaderboardMarks && <td className="p-3 text-right text-lg">{item.marks}</td>}
                      </tr>
                    ))}
                    {leaderboard.length === 0 && (
                      <tr><td colSpan={event.showLeaderboardMarks ? 3 : 2} className="p-3 text-center text-gray-400">Leaderboard data will be published by the organizer.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Sidebar (Right Column) */}
          <div className="space-y-8">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <h3 className="text-2xl font-semibold mb-4">Contact</h3>
              <p className="text-gray-300">For any queries, please contact:</p>
              <a href={`mailto:${event.contactDetails?.email}`} className="text-purple-400 text-lg hover:underline">
                {event.contactDetails?.email || 'No contact provided'}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}
      {activeModal === 'payments' && <VerifyPaymentsModal eventId={id} onClose={() => setActiveModal(null)} />}
      {activeModal === 'team' && <ManageTeamModal eventId={id} onClose={() => setActiveModal(null)} />}
      {activeModal === 'leaderboard' && <ManageLeaderboardModal eventId={id} event={event} currentLeaderboard={leaderboard} onClose={() => setActiveModal(null)} onSave={fetchEventAndLeaderboard} />}
    </div>
  );
}

// ===================================================================
// --- MODAL 1: VERIFY PAYMENTS ---
// ===================================================================
const VerifyPaymentsModal = ({ eventId, onClose }) => {
  const [pending, setPending] = useState({ teams: [], individuals: [] });
  const [loading, setLoading] = useState(true);
  const { getToken } = useAuth(); // This will now work

  const fetchPending = useCallback(async () => {
    setLoading(true);
    const token = getToken();
    const res = await fetch(`http://localhost:5000/api/organizer/event/${eventId}/verifications`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setPending(data);
    setLoading(false);
  }, [eventId, getToken]);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const handleAction = async (type, id, isApprove) => {
    const action = isApprove ? 'verify-payment' : 'reject-payment';
    const reason = isApprove ? '' : prompt('Reason for rejection:');
    
    const token = getToken();
    await fetch(`http://localhost:5000/api/organizer/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ type, id, reason })
    });
    fetchPending(); // Refresh list
  };

  return (
    <Modal title="Verify Payments" onClose={onClose}>
      {loading ? <p>Loading...</p> : (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <h4 className="text-lg font-semibold">Pending Teams</h4>
          {pending.teams.length === 0 && <p className="text-gray-400 text-sm">No pending team payments.</p>}
          {pending.teams.map(team => (
            <div key={team.teamId} className="bg-white/10 p-3 rounded">
              <p>{team.teamName} (Leader: {team.teamLeaderStudentId})</p>
              <p>Txn ID: {team.transactionId}</p>
              <a href={`http://localhost:5000${team.paymentScreenshotPath}`} target="_blank" rel="noreferrer" className="text-purple-400">View Screenshot</a>
              <div className="flex gap-2 mt-2">
                <button onClick={() => handleAction('Team', team.teamId, true)} className="admin-button-green text-sm">Verify</button>
                <button onClick={() => handleAction('Team', team.teamId, false)} className="admin-button-red text-sm">Reject</button>
              </div>
            </div>
          ))}
          <h4 className="text-lg font-semibold mt-4">Pending Individuals</h4>
          {pending.individuals.length === 0 && <p className="text-gray-400 text-sm">No pending individual payments.</p>}
          {pending.individuals.map(ind => (
             <div key={ind.id} className="bg-white/10 p-3 rounded">
              <p>Student: {ind.memberId}</p>
              <p>Txn ID: {ind.transactionId}</p>
              <a href={`http://localhost:5000${ind.paymentScreenshotPath}`} target="_blank" rel="noreferrer" className="text-purple-400">View Screenshot</a>
              <div className="flex gap-2 mt-2">
                <button onClick={() => handleAction('Individual', ind.id, true)} className="admin-button-green text-sm">Verify</button>
                <button onClick={() => handleAction('Individual', ind.id, false)} className="admin-button-red text-sm">Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

// ===================================================================
// --- MODAL 2: MANAGE TEAM ---
// ===================================================================
const ManageTeamModal = ({ eventId, onClose }) => {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [memberId, setMemberId] = useState('');
  const [memberType, setMemberType] = useState('Student');
  const [role, setRole] = useState('Committee Member');
  const { getToken } = useAuth(); // This will now work

  const fetchTeam = useCallback(async () => {
    setLoading(true);
    const token = getToken();
    const res = await fetch(`http://localhost:5000/api/organizer/event/${eventId}/team`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setTeam(data);
    setLoading(false);
  }, [eventId, getToken]);
  
  useEffect(() => { fetchTeam(); }, [fetchTeam]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    const token = getToken();
    await fetch(`http://localhost:5000/api/organizer/event/${eventId}/team`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ memberId, memberType, role })
    });
    alert('Team member added!');
    setMemberId('');
    fetchTeam(); // Refresh list
  };
  
  const handleRemoveMember = async (eventMemberId) => {
    if (!window.confirm("Are you sure you want to remove this team member?")) return;
    const token = getToken();
    await fetch(`http://localhost:5000/api/organizer/event/${eventId}/team/${eventMemberId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    alert('Team member removed.');
    fetchTeam(); // Refresh list
  };

  return (
    <Modal title="Manage Your Organizing Team" onClose={onClose}>
      <h4 className="text-lg font-semibold mb-2">Add New Member</h4>
      <form onSubmit={handleAddMember} className="space-y-4 mb-6">
        <select value={memberType} onChange={e => setMemberType(e.target.value)} className="input-field"><option value="Student">Student</option><option value="Employee">Employee</option></select>
        <input value={memberId} onChange={e => setMemberId(e.target.value)} placeholder={memberType === 'Student' ? 'Student ID' : 'Employee ID'} className="input-field" />
        <select value={role} onChange={e => setRole(e.target.value)} className="input-field">
          <option value="Committee Member">Committee Member</option>
          <option value="Student Organiser">Student Organiser (Core)</option>
          {memberType === 'Employee' && <option value="Employee Organiser">Employee Organiser (Faculty)</option>}
        </select>
        <button type="submit" className="admin-button-green w-full">Add Team Member</button>
      </form>
      <hr className="border-white/10 my-4" />
      <h4 className="text-lg font-semibold mb-2">Current Team</h4>
      <div className="space-y-2 max-h-[30vh] overflow-y-auto">
        {loading ? <p>Loading team...</p> : team.map(member => (
          <div key={member.id} className="bg-white/10 p-3 rounded flex justify-between items-center">
            <div>
              <p>{member.memberId} ({member.memberType})</p>
              <p className="text-sm text-purple-300">{member.role}</p>
            </div>
            <button onClick={() => handleRemoveMember(member.id)} className="admin-button-red text-sm">Remove</button>
          </div>
        ))}
      </div>
    </Modal>
  );
};

// ===================================================================
// --- MODAL 3: MANAGE LEADERBOARD ---
// ===================================================================
const ManageLeaderboardModal = ({ eventId, event, currentLeaderboard, onClose, onSave }) => {
  const [scores, setScores] = useState(currentLeaderboard); 
  const [showMarks, setShowMarks] = useState(event.showLeaderboardMarks);
  const { getToken } = useAuth(); // This will now work
  
  // TODO: Fetch existing competitors (teams/individuals) to populate this

  const handleScoreChange = (index, newMarks) => {
    const updatedScores = [...scores];
    updatedScores[index].marks = parseInt(newMarks, 10) || 0;
    setScores(updatedScores);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = getToken();
    await fetch(`http://localhost:5000/api/organizer/event/${eventId}/leaderboard`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ scores, showMarks }) 
    });
    alert('Leaderboard updated!');
    onSave(); 
    onClose();
  };

  return (
    <Modal title="Manage Leaderboard" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="flex items-center gap-3 p-4 bg-white/5 rounded-lg">
          <input type="checkbox" checked={showMarks} onChange={e => setShowMarks(e.target.checked)} className="w-5 h-5" />
          Show Marks/Points to Public
        </label>
        <hr className="border-white/10" />
        
        <div className="space-y-2">
          <h4 className="text-lg font-semibold">Edit Scores</h4>
          {scores.map((item, index) => (
            <div key={item.id} className="flex justify-between items-center bg-white/10 p-3 rounded">
              <label className="font-medium">{item.competitorId} ({item.competitorType})</label>
              <input 
                type="number"
                value={item.marks}
                onChange={(e) => handleScoreChange(index, e.target.value)}
                className="input-field w-24"
              />
            </div>
          ))}
        </div>
        
        <button type="submit" className="admin-button-green w-full">Save Leaderboard</button>
      </form>
    </Modal>
  );
};

// ===================================================================
// --- GENERIC MODAL COMPONENT ---
// ===================================================================
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md" onClick={onClose}>
    <div className="bg-slate-800 w-full max-w-2xl rounded-2xl border border-purple-500/50 p-6 shadow-xl" onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-semibold">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl">&times;</button>
      </div>
      <div>
        {children}
      </div>
    </div>
  </div>
);