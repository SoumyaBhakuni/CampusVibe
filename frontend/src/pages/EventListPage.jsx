import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function EventListPage() {
  const [activeTab, setActiveTab] = useState('all'); 
  const [activeSubFilter, setActiveSubFilter] = useState('all');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Fetches dynamically based on the activeTab
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError('');
        
        let url = 'http://localhost:5000/api/events';
        if (activeTab === 'fests') {
          url = 'http://localhost:5000/api/events?type=Fest';
        }
        
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch events');
        
        const data = await res.json();
        setEvents(data);
        setActiveSubFilter('all'); 
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Unable to load events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [activeTab]); 

  // --- TABS (SERVER-SIDE) ---
  const tabs = [
    { id: 'all', label: 'All Events' },
    { id: 'fests', label: 'Fests' },
  ];

  // --- FILTERS (CLIENT-SIDE) ---
  const subFilters = [
    { id: 'all', label: 'All' },
    { id: 'Paid', label: 'Paid' },
    { id: 'Free', label: 'Free' },
    { id: 'Team', label: 'Team' },
    { id: 'Individual', label: 'Individual' },
  ];

  // Client-side filtering logic
  const filteredEvents = events.filter(event => {
    if (activeSubFilter === 'all') return true;
    if (activeSubFilter === 'Paid') return event.isPaidEvent;
    if (activeSubFilter === 'Free') return !event.isPaidEvent;
    if (activeSubFilter === 'Team') return event.registrationType === 'Team';
    if (activeSubFilter === 'Individual') return event.registrationType === 'Individual';
    return true;
  });

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-red-400 text-xl">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-black/40 z-0"></div>
        <div className="relative z-10 pt-32 pb-20 px-8 text-center">
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6">
            Campus{' '}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Events
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Discover amazing events, connect with peers, and make your campus
            life unforgettable
          </p>
        </div>
      </div>

      {/* --- Main Tabs (All Events vs Fests) --- */}
      <div className="px-8 -mt-8 relative z-30">
        <div className="max-w-md mx-auto flex gap-2 bg-white/10 backdrop-blur-lg rounded-2xl p-2 border border-white/20">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[120px] px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-lg'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* --- Sub-Filters (Paid, Free, etc.) --- */}
      <div className="px-8 pt-10 relative z-20">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-1 border border-white/10">
            <div className="flex flex-wrap gap-1">
              {subFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveSubFilter(filter.id)}
                  className={`flex-1 min-w-[120px] px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    activeSubFilter === filter.id
                      ? 'bg-white/20 text-white'
                      : 'text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="px-8 py-16">
        <div className="max-w-7xl mx-auto">
          {loading ? (
             <div className="text-center text-white text-2xl">
              Loading events...
            </div>
          ) : filteredEvents.length === 0 ? (
            <p className="text-center text-gray-400 text-lg">
              No events found for this category.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CTA Section */}
      <div className="px-8 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl p-12 border border-white/10 backdrop-blur-lg">
            <h2 className="text-4xl font-bold text-white mb-4">
              Want to Host Your Own Event?
            </h2>
            <p className="text-gray-300 text-xl mb-8">
              Submit a request to organize an event and bring the campus together.
            </p>
            <button
              onClick={() => navigate('/request-event')}
              className="bg-white text-slate-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-2xl"
            >
              Request to Organize +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===================================================================
// --- HELPER COMPONENT (REFACTORED) ---
// ===================================================================
const EventCard = ({ event }) => (
  <div 
    className="group bg-white/5 backdrop-blur-lg rounded-3xl overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-500 hover:transform hover:-translate-y-2 flex flex-col"
  >
    {/* --- THIS IS THE FIX --- */}
    {event.ParentEvent && (
      <div className="bg-purple-500 text-white text-sm font-semibold p-2 text-center">
        Part of: {event.ParentEvent.eventName}
      </div>
    )}
    {/* --- END OF FIX --- */}
    
    <img
      src={event.bannerUrl ? `http://localhost:5000${event.bannerUrl}` : 'https://images.unsplash.com/photo-1511578314322-379afb476865?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzNTU2MDB8MHwxfHNlYXJjaHw0fHxldmVudHxlbnwwfHx8fDE2OTg0MTc5NTJ8MA&ixlib.rb-4.0.3&q=80&w=1080'}
      alt={event.eventName}
      className="w-full h-48 object-cover"
    />
    <div className="p-6 flex flex-col flex-grow">
      <div className="flex justify-between items-start mb-4">
        <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">
          {event.registrationType}
        </span>
        <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          {new Date(event.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>
      <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-purple-300 transition-colors">
        {event.eventName}
      </h3>
      <div className="flex items-center justify-between text-gray-400 mb-6">
        <span>📍 {event.venue}</span>
        <span className={event.isPaidEvent ? "text-green-400" : ""}>
          {event.isPaidEvent ? 'Paid' : 'Free'}
        </span>
      </div>
      
      {/* This pushes the button to the bottom */}
      <div className="mt-auto">
        <Link 
          to={`/events/${event.id}`} 
          className="w-full text-center block bg-white/10 text-white py-3 rounded-xl font-semibold hover:bg-white/20 transition-all"
        >
          Learn More
        </Link>
      </div>
    </div>
  </div>
);