import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function ClubListPage() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch all clubs from our new public backend route
  useEffect(() => {
    const fetchClubs = async () => {
      try {
        setLoading(true);
        // This calls the GET /api/clubs route we created
        const res = await fetch('http://localhost:5000/api/clubs');
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || 'Failed to fetch clubs');
        }
        const data = await res.json();
        setClubs(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchClubs();
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 p-8 text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header section similar to Eventpage.jsx */}
        <div className="relative overflow-hidden mb-12">
          <div className="relative z-10 pt-16 pb-12 px-8 text-center">
            <h1 className="text-6xl md:text-7xl font-bold text-white mb-6">
              University{' '}
              <span className="bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Clubs
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Find your community. Explore the clubs and organizations active on campus.
            </p>
          </div>
        </div>
        
        {/* Loading and Error States */}
        {loading && <div className="text-center text-2xl">Loading clubs...</div>}
        {error && <div className="text-center text-red-400 text-2xl">{error}</div>}
        
        {/* Clubs Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {clubs.length > 0 ? (
              clubs.map((club) => (
                <Link 
                  // This links to the /clubs/:id route (ClubDashboard.jsx)
                  to={`/clubs/${club.clubId}`} 
                  key={club.clubId} 
                  className="group bg-white/5 backdrop-blur-lg rounded-3xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:-translate-y-1"
                >
                  {/* Mock Logo */}
                  <div className="w-20 h-20 bg-linear-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    {/* Placeholder icon */}
                    <span className="text-3xl">🏛️</span> 
                  </div>
                  <h3 className="text-2xl font-bold text-white text-center mb-2 group-hover:text-purple-300 transition-colors">
                    {club.clubName}
                  </h3>
                  {/* ✅ BUG FIX: Corrected closing </p> tag */}
                  <p className="text-gray-400 text-center line-clamp-3">
                    {club.clubDescription || 'No description available.'}
                  </p>
                </Link>
              ))
            ) : (
              <p className="text-center col-span-4 text-gray-400 text-lg">
                No clubs found.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}