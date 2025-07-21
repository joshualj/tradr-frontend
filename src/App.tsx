// src/App.tsx

import React, { useState, useEffect } from 'react';
import { Typewriter } from 'react-simple-typewriter';
import StockAnalysis from './components/StockAnalysis';
import StockTrackerAndAlerts from './components/StockTrackerAndAlerts';

function App() {
  const [showContent, setShowContent] = useState(false);
  // New state to manage current page: 'analysis' or 'tracker'
  const [currentPage, setCurrentPage] = useState<'analysis' | 'tracker'>('analysis');

  // Delay the appearance of main content until typing is complete
  useEffect(() => {
    const typingDuration = 'Tradr Stock Analysis Platform'.length * 75 + 1000; // 75ms per char + 1s delay
    const timer = setTimeout(() => {
      setShowContent(true);
    }, typingDuration);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 font-inter text-gray-800">
      <header className="py-8 bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-lg">
        <h1 className="text-4xl font-extrabold text-center mb-4">
          <Typewriter
            words={['Tradr Stock Analysis Platform']}
            loop={1}
            cursor
            cursorStyle="|"
            typeSpeed={75}
            deleteSpeed={50}
            delaySpeed={1000}
            onLoopDone={() => setShowContent(true)} // Ensure content shows after typing
          />
        </h1>
        {/* Navigation Buttons */}
        <nav className="flex justify-center gap-4 mt-6">
          <button
            onClick={() => setCurrentPage('analysis')}
            className={`
              px-6 py-3 rounded-full font-semibold text-lg transition-all duration-300 ease-in-out
              ${currentPage === 'analysis' ? 'bg-white text-indigo-700 shadow-md transform scale-105' : 'bg-indigo-500 text-white hover:bg-indigo-400'}
            `}
          >
            Individual Stock Lookup
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

      <main className="container mx-auto p-6 transition-opacity duration-600 ease-in-out"
            style={{ opacity: showContent ? 1 : 0, transform: showContent ? 'translateY(0)' : 'translateY(20px)' }}>
        {/* Conditionally render components based on currentPage */}
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
