import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // Our new auth hook

export default function Addevent() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clubs, setClubs] = useState([]); // To populate the club dropdown
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    // Step 1: Details
    eventName: '',
    eventDesc: '',
    startTime: '',
    endTime: '',
    venue: '',
    contactDetails: '',
    clubId: '', 
    // Step 2: Rules
    registrationType: 'Individual',
    isPaidEvent: false,
    hasLeaderboard: false,
    showLeaderboardMarks: false,
    // --- UPDATED FOR FORM BUILDER ---
    // Step 3: Form
    registrationSchema: [], // Now an array to hold question objects
    // --- END UPDATE ---
    // Step 4: Files
    banner: null,
    paymentQRCodes: [],
  });

  // Fetch clubs for the dropdown (Step 1)
  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/clubs');
        if (res.ok) {
          setClubs(await res.json());
        }
      } catch (err) {
        console.error("Failed to fetch clubs", err);
      }
    };
    fetchClubs();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (name === 'banner') {
      setFormData(prev => ({ ...prev, banner: files[0] })); // Single file
    } else {
      setFormData(prev => ({ ...prev, paymentQRCodes: files })); // Multiple files
    }
  };
  
  // --- NEW FUNCTIONS FOR FORM BUILDER ---
  const addSchemaField = (type) => {
    setFormData(prev => ({
      ...prev,
      registrationSchema: [
        ...prev.registrationSchema,
        { id: Date.now(), type: type, label: '', required: true }
      ]
    }));
  };

  const removeSchemaField = (id) => {
    setFormData(prev => ({
      ...prev,
      registrationSchema: prev.registrationSchema.filter(field => field.id !== id)
    }));
  };

  const updateSchemaField = (id, property, value) => {
    setFormData(prev => ({
      ...prev,
      registrationSchema: prev.registrationSchema.map(field => 
        field.id === id ? { ...field, [property]: value } : field
      )
    }));
  };
  // --- END NEW FUNCTIONS ---

  const handleNext = () => setStep(prev => prev + 1);
  const handlePrev = () => setStep(prev => prev - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = getToken();
      if (!token) {
        alert('You must be logged in.');
        navigate('/signin');
        return;
      }

      const data = new FormData();
      
      data.append('eventName', formData.eventName);
      data.append('eventDesc', formData.eventDesc);
      data.append('startTime', formData.startTime);
      data.append('endTime', formData.endTime);
      data.append('venue', formData.venue);
      data.append('contactDetails', JSON.stringify({ email: formData.contactDetails }));
      data.append('registrationType', formData.registrationType);
      data.append('isPaidEvent', formData.isPaidEvent);
      data.append('hasLeaderboard', formData.hasLeaderboard);
      data.append('showLeaderboardMarks', formData.showLeaderboardMarks);
      data.append('registrationLocked', false); // Default to open

      if (formData.clubId) {
        data.append('clubId', formData.clubId);
      }
      
      // --- UPDATED FOR FORM BUILDER ---
      // Send the custom form schema to the backend
      data.append('registrationSchema', JSON.stringify(formData.registrationSchema));
      // --- END UPDATE ---

      if (formData.banner) {
        data.append('banner', formData.banner);
      }
      if (formData.paymentQRCodes.length > 0) {
        for (let i = 0; i < formData.paymentQRCodes.length; i++) {
          data.append('paymentQRCodes', formData.paymentQRCodes[i]);
        }
      }

      const res = await fetch('http://localhost:5000/api/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: data,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to create event');
      }

      alert('Event created successfully!');
      navigate('/organizer/dashboard');

    } catch (err) {
      setError(err.message);
      setStep(1); 
    } finally {
      setLoading(false);
    }
  };
  
  const progress = (step / 4) * 100;

  return (
    <div className='min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 flex justify-center items-center p-6 text-white'>
      <form onSubmit={handleSubmit} className='bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 w-full max-w-3xl'>
        {/* Header */}
        <div className='text-center mb-8'>
          <h2 className='text-3xl font-bold bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent'>
            Create New Event
          </h2>
          <p className='text-gray-400 mt-2'>Step {step} of 4</p>
          <div className="w-full bg-white/10 rounded-full h-2.5 mt-4">
            <div className="bg-linear-to-r from-purple-500 to-pink-500 h-2.5 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-xl mb-4 text-center">{error}</div>}

        {/* --- STEP 1: Event Details --- */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Step 1: Event Details</h3>
            <input name="eventName" value={formData.eventName} onChange={handleChange} placeholder="Event Name" className="input-field" required />
            <textarea name="eventDesc" value={formData.eventDesc} onChange={handleChange} placeholder="Event Description" className="input-field" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 font-medium mb-2">Start Time</label>
                <input name="startTime" value={formData.startTime} type="datetime-local" onChange={handleChange} className="input-field" required />
              </div>
              <div>
                <label className="block text-gray-300 font-medium mb-2">End Time</label>
                <input name="endTime" value={formData.endTime} type="datetime-local" onChange={handleChange} className="input-field" required />
              </div>
            </div>
            <input name="venue" value={formData.venue} onChange={handleChange} placeholder="Venue" className="input-field" required />
            <input name="contactDetails" value={formData.contactDetails} type="email" onChange={handleChange} placeholder="Public Contact Email" className="input-field" required />
            <select name="clubId" value={formData.clubId} onChange={handleChange} className="input-field">
              <option value="" className="bg-slate-800">No associated club (optional)</option>
              {clubs.map(club => (
                <option key={club.clubId} value={club.clubId} className="bg-slate-800">{club.clubName}</option>
              ))}
            </select>
            <div className='flex justify-end pt-4'>
              <button type="button" onClick={handleNext} className='bg-linear-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-xl font-semibold'>
                Next
              </button>
            </div>
          </div>
        )}

        {/* --- STEP 2: Event Rules --- */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Step 2: Registration Rules</h3>
            <div>
              <label className="block text-gray-300 font-medium mb-2">Registration Type</label>
              <select name="registrationType" value={formData.registrationType} onChange={handleChange} className="input-field">
                <option value="Individual" className="bg-slate-800">Individual Registration</option>
                <option value="Team" className="bg-slate-800">Team Registration</option>
              </select>
            </div>
            <div className="flex flex-col gap-4 pt-2">
              <label className="flex items-center gap-3 p-4 bg-white/5 rounded-lg">
                <input type="checkbox" name="isPaidEvent" checked={formData.isPaidEvent} onChange={handleChange} className="w-5 h-5" />
                Is this a paid event? (You will upload QR codes in Step 4)
              </label>
              <label className="flex items-center gap-3 p-4 bg-white/5 rounded-lg">
                <input type="checkbox" name="hasLeaderboard" checked={formData.hasLeaderboard} onChange={handleChange} className="w-5 h-5" />
                Does this event have a leaderboard?
              </label>
              {formData.hasLeaderboard && (
                <label className="flex items-center gap-3 p-4 bg-white/10 rounded-lg ml-8">
                  <input type="checkbox" name="showLeaderboardMarks" checked={formData.showLeaderboardMarks} onChange={handleChange} className="w-5 h-5" />
                  Show marks/points publicly on the leaderboard?
                </label>
              )}
            </div>
            <div className='flex justify-between pt-4'>
              <button type="button" onClick={handlePrev} className='bg-white/10 text-gray-300 px-8 py-3 rounded-xl font-semibold'>
                Back
              </button>
              <button type="button" onClick={handleNext} className='bg-linear-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-xl font-semibold'>
                Next
              </button>
            </div>
          </div>
        )}

        {/* --- STEP 3: Form Builder (REFACTORED) --- */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Step 3: Custom Registration Form</h3>
            <p className="text-gray-400 text-sm">Add custom fields to your registration form. Default fields (like Team Name or Payment Proof) will be added automatically based on your rules from Step 2.</p>
            
            <div className="flex gap-2">
              <button type="button" onClick={() => addSchemaField('text')} className="admin-button">Add Text Field</button>
              <button type="button" onClick={() => addSchemaField('email')} className="admin-button">Add Email Field</button>
              <button type="button" onClick={() => addSchemaField('tel')} className="admin-button">Add Phone Field</button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto p-2">
              {formData.registrationSchema.length === 0 && (
                <p className="text-gray-500 text-center p-4">No custom fields added.</p>
              )}
              {formData.registrationSchema.map((field, index) => (
                <div key={field.id} className="bg-white/5 p-4 rounded-lg border border-white/10">
                  <div className="flex justify-between items-center gap-4">
                    <input 
                      type="text"
                      placeholder={`Question Label (e.g., T-shirt Size)`}
                      value={field.label}
                      onChange={(e) => updateSchemaField(field.id, 'label', e.target.value)}
                      className="input-field flex-grow"
                    />
                    <div className="flex items-center gap-2">
                      <label htmlFor={`required-${field.id}`} className="text-sm">Required</label>
                      <input
                        type="checkbox"
                        id={`required-${field.id}`}
                        checked={field.required}
                        onChange={(e) => updateSchemaField(field.id, 'required', e.target.checked)}
                        className="w-5 h-5"
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeSchemaField(field.id)}
                      className="text-red-400 hover:text-red-300 font-bold text-2xl"
                    >
                      &times;
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Field Type: {field.type}</p>
                </div>
              ))}
            </div>

            <div className='flex justify-between pt-4'>
              <button type="button" onClick={handlePrev} className='bg-white/10 text-gray-300 px-8 py-3 rounded-xl font-semibold'>
                Back
              </button>
              <button type="button" onClick={handleNext} className='bg-linear-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-xl font-semibold'>
                Next
              </button>
            </div>
          </div>
        )}

        {/* --- STEP 4: Files & Submit --- */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Step 4: Uploads</h3>
            <div>
              <label className='block text-gray-300 font-medium mb-2'>Event Banner (1 image)</label>
              <input type="file" name="banner" onChange={handleFileChange} accept='image/*' className="input-file" />
            </div>
            
            {formData.isPaidEvent && (
              <div>
                <label className='block text-gray-300 font-medium mb-2'>Payment QR Codes (Up to 5)</label>
                <input type="file" name="paymentQRCodes" onChange={handleFileChange} accept='image/*' multiple className="input-file" />
              </div>
            )}

            <div className='flex justify-between pt-6'>
              <button type="button" onClick={handlePrev} className='bg-white/10 text-gray-300 px-8 py-3 rounded-xl font-semibold'>
                Back
              </button>
              <button type='submit' disabled={loading} className='bg-linear-to-r from-green-500 to-emerald-500 text-white px-8 py-3 rounded-xl font-semibold disabled:opacity-50'>
                {loading ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}