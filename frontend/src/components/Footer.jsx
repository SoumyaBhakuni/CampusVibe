import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-slate-900/80 backdrop-blur-lg border-t border-white/10 py-4">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-400">
            © {new Date().getFullYear()} <span className="bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-semibold">CampusVibe</span>. All rights reserved.
          </div>
          <div className="text-gray-500">
            Made by VIZION
          </div>
        </div>
      </div>
    </footer>
  );
}