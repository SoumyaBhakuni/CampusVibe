import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function EventRequestForm() {
  // Form state
  const [requestorEmail, setRequestorEmail] = useState('');
  const [eventDetails, setEventDetails] = useState('');
  const [requestType, setRequestType] = useState('Single'); // 'Single' or 'Fest'
  const [scope, setScope] = useState('Individual'); // 'Individual' or 'Part of Fest'
  const [requestedEventCount, setRequestedEventCount] = useState(1);
  const [parentFestId, setParentFestId] = useState('');

  // Dropdown state
  const [fests, setFests] = useState([]);
  const [loadingFests, setLoadingFests] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Fetch active fests for the "Part of Fest" dropdown
  useEffect(() => {
    // This effect runs only when the user selects 'Part of Fest'
    if (requestType === 'Single' && scope === 'Part of Fest') {
      const fetchFests = async () => {
        setLoadingFests(true);
        try {
          // --- THIS IS THE FIX ---
          // Fetches only "Parent Fests" (where parentId is null)
          const res = await fetch('http://localhost:5000/api/events?type=Fest');
          // --- END OF FIX ---

          if (!res.ok) throw new Error('Failed to load fests');
          const data = await res.json();
          
          // No frontend filtering is needed now, as the backend does it.
          setFests(data); 
        } catch (err) {
          console.error("Failed to fetch fests:", err);
        } finally {
          setLoadingFests(false);
        }
      };
      fetchFests();
    }
  }, [requestType, scope]); // Re-run if these change

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // This object matches the 'EventRequest' model in our backend
    const formData = {
      requestorEmail,
      eventDetails,
      requestType,
      scope: requestType === 'Fest' ? 'Individual' : scope, // Fests are always 'Individual' scope
      parentFestId: (requestType === 'Single' && scope === 'Part of Fest') ? parentFestId : null,
      requestedEventCount: requestType === 'Fest' ? requestedEventCount : 1,
    };

    try {
      // This is our new public route
      const res = await fetch('http://localhost:5000/api/event-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to submit request');
      }

      alert('Request submitted! An admin will review it shortly.');
      navigate('/'); // Go back home
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 flex items-center justify-center p-4 text-white">
      <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 p-8 w-full max-w-2xl">
        <h2 className="text-3xl font-bold text-white text-center mb-6">Request to Organize an Event</h2>
        <p className="text-gray-300 text-center mb-6">Submit your idea. If approved, you will receive an email with your new Organizer account credentials.</p>
        
        {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-xl mb-4">{error}</div>}
        
        <div className="space-y-4">
          <input 
            type="email" 
            value={requestorEmail} 
            onChange={e => setRequestorEmail(e.target.value)} 
            placeholder="Your Contact Email" 
            className="input-field" 
            required 
          />
          <textarea 
            value={eventDetails} 
            onChange={e => setEventDetails(e.target.value)} 
            placeholder="Describe your event..." 
            className="input-field" 
            rows="4"
            required 
          />

          <hr className="border-white/10" />

          {/* --- Conditional Logic --- */}
          <div>
            <label className="block text-gray-300 font-medium mb-2">1. What is the event type?</label>
            <select value={requestType} onChange={e => setRequestType(e.target.value)} className="input-field">
              <option value="Single" className="bg-slate-800">Single Event</option>
              <option value="Fest" className="bg-slate-800">Fest (Multiple Sub-Events)</option>
            </select>
          </div>

          {/* Shows if "Fest" is selected */}
          {requestType === 'Fest' && (
            <div>
              <label className="block text-gray-300 font-medium mb-2">2. How many sub-events do you plan to host?</label>
              <input 
                type="number" 
                min="1" 
                value={requestedEventCount} 
                onChange={e => setRequestedEventCount(e.target.value)} 
                placeholder="Number of Events (e.g., 15)" 
                className="input-field" 
              />
            </div>
          )}

          {/* Shows if "Single Event" is selected */}
          {requestType === 'Single' && (
            <div>
              <label className="block text-gray-300 font-medium mb-2">2. What is the scope of this event?</label>
              <select value={scope} onChange={e => setScope(e.target.value)} className="input-field">
                <option value="Individual" className="bg-slate-800">Individual (Standalone Event)</option>
                <option value="Part of Fest" className="bg-slate-800">Part of an Existing Fest</option>
              </select>
            </div>
          )}

          {/* Shows if "Part of Fest" is selected */}
          {requestType === 'Single' && scope === 'Part of Fest' && (
            <div>
              <label className="block text-gray-300 font-medium mb-2">3. Which fest?</label>
              {loadingFests ? <p>Loading fests...</p> : (
                <select value={parentFestId} onChange={e => setParentFestId(e.target.value)} className="input-field" required>
                  <option value="" className="bg-slate-800">Select Parent Fest...</option>
                  {fests.map(fest => (
                    <option key={fest.id} value={fest.id} className="bg-slate-800">{fest.eventName}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          <button type="submit" disabled={loading || loadingFests} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold disabled:opacity-50">
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
}