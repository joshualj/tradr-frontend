// src/App.tsx

import React, { useState, useEffect } from 'react';
import { Typewriter } from 'react-simple-typewriter'; // This import will no longer be strictly needed but can remain if Typewriter is used elsewhere
import StockAnalysis from './components/StockAnalysis';
import StockTrackerAndAlerts from './components/StockTrackerAndAlerts';

function App() {
  // Removed showContent state and useEffect as content will always be visible
  const [currentPage, setCurrentPage] = useState<'analysis' | 'tracker'>('analysis');

  return (
    <div className="min-h-screen bg-gray-50 font-inter text-gray-800">
      <header className="py-8 bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-lg">
        <h1 className="text-4xl font-extrabold text-center mb-4">
          {/* Replaced Typewriter with static text */}
          Tradr Stock Analysis Platform
        </h1>
        <nav className="flex justify-center gap-4 mt-6">
          <button
            onClick={() => setCurrentPage('analysis')}
            className={`
              px-6 py-3 rounded-full font-semibold text-lg transition-all duration-300 ease-in-out
              ${currentPage === 'analysis' ? 'bg-white text-indigo-700 shadow-md transform scale-105' : 'bg-indigo-500 text-white hover:bg-indigo-400'}
            `}
          >
            Stock Lookup
          </button>
          <button
            onClick={() => setCurrentPage('tracker')}
            className={`
              px-6 py-3 rounded-full font-semibold text-lg transition-all duration-300 ease-in-out
              ${currentPage === 'tracker' ? 'bg-white text-indigo-700 shadow-md transform scale-105' : 'bg-indigo-500 text-white hover:bg-indigo-400'}
            `}
          >
            My Tracked Stocks
          </button>
        </nav>
      </header>

      <main className="container mx-auto p-6">
        {currentPage === 'analysis' && (
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 max-w-2xl mx-auto">
            <StockAnalysis />
          </div>
        )}
        {currentPage === 'tracker' && (
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 max-w-3xl mx-auto">
            <StockTrackerAndAlerts />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;