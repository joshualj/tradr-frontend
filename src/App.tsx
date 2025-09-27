import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom'; // Import ReactDOM for createPortal
import StockAnalysis from './components/StockAnalysis';
import StockTrackerAndAlerts from './components/StockTrackerAndAlerts';

// Firebase imports for authentication
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut, inMemoryPersistence, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import type { Auth, User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

// Declare global variables provided by the Canvas environment OR defined by Vite
declare const __firebase_config: string; // Will always be a JSON string
declare const __app_id: any; // Use 'any' to allow for both string and object types for appId
declare const __initial_auth_token: string; // Will be a JSON string (e.g., '"some_token"' or 'null')

let firebaseConfig: any;
let appId: string;
let initialAuthToken: string | null;

// Safely parse global variables and log any errors during parsing
try {
  firebaseConfig = typeof __firebase_config === 'string' ? JSON.parse(__firebase_config) : __firebase_config;
  appId = typeof __app_id === 'string' && !__app_id.startsWith('{') && !__app_id.startsWith('[') ? __app_id : JSON.parse(__app_id);
  initialAuthToken = JSON.parse(__initial_auth_token);

  console.log('App.tsx: Parsed firebaseConfig:', firebaseConfig);
  console.log('App.tsx: Parsed appId:', appId);
  console.log('App.tsx: Parsed initialAuthToken:', initialAuthToken);

} catch (e: unknown) {
  console.error("App.tsx: Error parsing global Firebase variables:", e);
  // If parsing fails, these variables might be undefined, leading to further errors.
  // We'll set them to null/defaults to prevent immediate crashes, and the authError state will catch it.
  firebaseConfig = null;
  appId = 'parse-error-app-id';
  initialAuthToken = null;
}


function App() {
  const [currentPage, setCurrentPage] = useState<'analysis' | 'tracker'>('analysis');
  const [user, setUser] = useState<User | null>(null);
  const [db, setDb] = useState<Firestore | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false); // New state for login prompt

  // New states for email/password login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true); // true for Login, false for Sign Up

  // Ref to store the Firebase app instance to avoid re-initialization
  const firebaseAppRef = useRef<any>(null);

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  };

  // Centralized Firebase Initialization and Auth Listener
  useEffect(() => {
    const initializeFirebase = async () => {
      // Check if firebaseConfig is valid before initializing
      if (!firebaseConfig || Object.keys(firebaseConfig).length === 0) {
        const errorMsg = "Firebase configuration is missing or invalid. Cannot initialize Firebase.";
        console.error("App.tsx:", errorMsg, firebaseConfig);
        setAuthError(errorMsg);
        return;
      }

      try {
        if (!firebaseAppRef.current) {
          firebaseAppRef.current = initializeApp(firebaseConfig);
        }
        const firestore = getFirestore(firebaseAppRef.current);
        const firebaseAuth = getAuth(firebaseAppRef.current);

        setDb(firestore);
        setAuth(firebaseAuth);

        await firebaseAuth.setPersistence(inMemoryPersistence);
        console.log("App.tsx: Persistence set to inMemoryPersistence.");

        const initialAuthPromise = new Promise<User | null>((resolve) => {
          const unsubscribe = onAuthStateChanged(firebaseAuth, (currentUser) => {
            unsubscribe();
            resolve(currentUser);
          });
        });

        const initialUser = await initialAuthPromise;

        if (initialUser) {
          console.log('App.tsx: Initial user detected:', initialUser.uid, '. Signing out to ensure unauthenticated start.');
          await signOut(firebaseAuth);
          setUser(null);
          setIsLoadingAuth(false);
          setShowLoginPrompt(false); // Do not show prompt immediately after signing out auto-logged-in user
        } else {
          console.log('App.tsx: No initial user detected. Starting unauthenticated.');
          setUser(null);
          setIsLoadingAuth(false);
          setShowLoginPrompt(false); // Do not show prompt on initial app load
        }

        const unsubscribeOngoing = onAuthStateChanged(firebaseAuth, (currentUser) => {
          setUser(currentUser);
          if (currentUser) {
            console.log('App.tsx: User authenticated (ongoing):', currentUser.uid);
            setShowLoginPrompt(false);
          } else {
            console.log('App.tsx: User not authenticated (ongoing).');
            if (currentPage === 'tracker') {
              setShowLoginPrompt(true);
            }
          }
        });

        return () => unsubscribeOngoing();

      } catch (error: unknown) {
        console.error("App.tsx: Firebase initialization error:", error);
        setAuthError("Failed to initialize Firebase. Please check console for details: " + getErrorMessage(error));
        setIsLoadingAuth(false);
      }
    };

    initializeFirebase();
  }, []);

  const handleAuthAction = async () => { // Renamed from handleLogin to be more generic
    if (!auth) {
      setAuthError("Firebase Auth not initialized.");
      return;
    }
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, email, password);
        console.log('Signed in with email/password.');
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        console.log('Signed up with email/password.');
      }
      setShowLoginPrompt(false);
      setCurrentPage('tracker');
    } catch (error: unknown) {
      console.error('Error during email/password auth:', error);
      setAuthError('Authentication error: ' + getErrorMessage(error));
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleGuestLogin = async () => { // New function for guest login
    if (!auth) {
      setAuthError("Firebase Auth not initialized.");
      return;
    }
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      if (initialAuthToken) {
        await signInWithCustomToken(auth, initialAuthToken);
        console.log('Signed in with custom token.');
      } else {
        await signInAnonymously(auth);
        console.log('Signed in anonymously.');
      }
      setShowLoginPrompt(false);
      setCurrentPage('tracker');
    } catch (error: unknown) {
      console.error('Error signing in anonymously:', error);
      setAuthError('Error signing in as guest: ' + getErrorMessage(error));
    } finally {
      setIsLoadingAuth(false);
    }
  };


  const handleTrackerClick = () => {
    console.log('App.tsx: handleTrackerClick called. user:', user?.uid, 'showLoginPrompt:', showLoginPrompt, 'isLoadingAuth:', isLoadingAuth);
    if (!user) {
      setCurrentPage('tracker'); // Switch to tracker page first
      setShowLoginPrompt(true); // Then show the login prompt
    } else {
      setCurrentPage('tracker'); // Already logged in, just switch page
    }
  };

  console.log('App.tsx: Render State - isLoadingAuth:', isLoadingAuth, 'user:', user?.uid, 'showLoginPrompt:', showLoginPrompt, 'currentPage:', currentPage);

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-lg font-semibold text-gray-700">Loading Tradr App...</div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-red-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold text-red-700 mb-4">Authentication Error</h2>
          <p className="text-gray-700 mb-4">{authError}</p>
          <p className="text-sm text-gray-500">Please check your Firebase configuration and network connection.</p>
        </div>
      </div>
    );
  }

  // Define the backdrop element
  const backdropElement = (
    <div className={`
      fixed inset-0 // Covers entire viewport
      select-none pointer-events-none
      z-0
    `}>
      <span style={{
        position: 'absolute',
        top: '50%', // Center vertically
        left: '100%', // Position the left edge of the element at the right edge of the viewport
        transform: 'translate(-115%, -160%) rotate(-90deg)', // Updated translate values based on user feedback
        transformOrigin: '100% 50%', // Pivot around the right-middle of the unrotated element
        fontSize: '40vh',      // Use viewport height for vertical scaling
        color: 'rgb(107, 70, 193)', // Deeper purple color
        opacity: 0.07,          // Reduced opacity for more subtlety
        fontWeight: '900',    // Ultra bold
        textShadow: '2px 2px 4px rgba(0,0,0,0.05)', // Even more subtle shadow
        display: 'block',      // Ensure it behaves as a block element
        lineHeight: '1',      // Ensure line height doesn't collapse text
        whiteSpace: 'nowrap', // Prevent text from wrapping
        overflow: 'hidden',    // Keep hidden for clean clipping
        textAlign: 'center',  // Center text within its own rotated block
      }}>
        tradr
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-inter text-gray-800 relative"> {/* Added relative to the outermost div */}
      {/* Render backdrop using a Portal */}
      {ReactDOM.createPortal(
        // Conditional rendering for the backdrop
        (currentPage === 'analysis' || (currentPage === 'tracker' && user)) ? backdropElement : null,
        document.body // Render directly into the body
      )}

      <header className="py-4 bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-lg relative z-20"> {/* Added relative z-20 */}
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between px-4">
          {/* Left: Navigation Buttons */}
          <nav className="flex gap-4 mb-4 sm:mb-0">
            <button
              onClick={() => setCurrentPage('analysis')}
              className={`
                px-4 py-2 rounded-full font-semibold text-base transition-all duration-300 ease-in-out
                ${currentPage === 'analysis' ? 'bg-white text-indigo-700 shadow-md' : 'bg-indigo-500 text-white hover:bg-indigo-400'}
              `}
            >
              Individual Stock Lookup
            </button>
            <button
              onClick={handleTrackerClick}
              className={`
                px-4 py-2 rounded-full font-semibold text-base transition-all duration-300 ease-in-out
                ${currentPage === 'tracker' ? 'bg-white text-indigo-700 shadow-md' : 'bg-indigo-500 text-white hover:bg-indigo-400'}
              `}
              disabled={isLoadingAuth}
            >
              My Tracked Stocks
            </button>
          </nav>

          {/* Right: App Title */}
          <h1 className="text-2xl font-extrabold text-right">
            Tradr Stock Analysis Platform
          </h1>
        </div>
      </header>

      {/* Main content container with conditional centering */}
      <main className={`container mx-auto p-6 relative z-20 ${currentPage === 'analysis' ? 'flex items-center justify-center' : ''}`}>
        {currentPage === 'analysis' && (
          // The fix: removed the wrapper div to let StockAnalysis component handle its own layout
          <StockAnalysis />
        )}
        {currentPage === 'tracker' && user && (
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 max-w-3xl mx-auto">
            <StockTrackerAndAlerts db={db} auth={auth} userId={user.uid} />
          </div>
        )}
        {currentPage === 'tracker' && !user && showLoginPrompt && (
          <div className="bg-white p-8 rounded-lg shadow-2xl text-center max-w-md mx-auto">
            <h2 className="text-2xl font-extrabold text-indigo-700 mb-4">
              Access Your Tracked Stocks
            </h2>
            <p className="text-lg text-gray-700 mb-6">
              Please sign in to manage your personalized stock watchlist and alerts.
            </p>

            {/* Email/Password Login/Sign Up Form */}
            <div className="mt-6 mb-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 mb-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                onClick={handleAuthAction}
                disabled={isLoadingAuth || !email || !password}
                className="w-full px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingAuth ? 'Processing...' : (isLoginMode ? 'Login with Email' : 'Sign Up with Email')}
              </button>
              <button
                onClick={() => setIsLoginMode(!isLoginMode)}
                className="mt-3 w-full px-8 py-2 text-indigo-600 font-semibold rounded-lg hover:text-indigo-800 transition duration-200"
              >
                {isLoginMode ? 'New user? Sign Up' : 'Already have an account? Login'}
              </button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">OR</span>
              </div>
            </div>

            {/* Guest Login Option */}
            <button
              onClick={handleGuestLogin}
              disabled={isLoadingAuth}
              className="w-full px-8 py-4 bg-gray-600 text-white font-bold text-xl rounded-lg shadow-lg hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-300 transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingAuth ? 'Signing In...' : 'Continue as Guest'}
            </button>
            <p className="text-sm text-gray-500 mt-4">
              (No account needed for guest access, data is saved by device.)
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;