import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, collection } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

// Declare global variables provided by the Canvas environment OR defined by Vite
// These declarations are now also in src/vite-env.d.ts for TypeScript linting
declare const __firebase_config: string;
declare const __app_id: string;
declare const __initial_auth_token: string | null;

// Safely parse firebaseConfig: if it's already an object, use it directly; otherwise, parse it.
const firebaseConfig = typeof __firebase_config === 'string' ? JSON.parse(__firebase_config) : __firebase_config;

// Ensure appId correctly uses the __app_id global variable (parse if it's a stringified JSON)
const appId = typeof __app_id === 'string' && !__app_id.startsWith('{') && !__app_id.startsWith('[') ? __app_id : JSON.parse(__app_id);

// Parse initialAuthToken if it's a string, otherwise keep it null
const initialAuthToken = __initial_auth_token === 'null' ? null : __initial_auth_token;


// Define an interface for the Alert object to provide type safety
interface Alert {
  id: string;
  stockTicker: string;
  alertType: 'significant_increase' | 'significant_drop';
  percentageChange: number;
  periodDays: number;
  currentPrice: number;
  alertTimestamp: string; // ISO string format
  message?: string; // Optional message
  isRead: boolean;
}

function StockTrackerAndAlerts() {
  const [db, setDb] = useState<Firestore | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [trackedStocks, setTrackedStocks] = useState<string[]>([]);
  const [userAlerts, setUserAlerts] = useState<Alert[]>([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [newStock, setNewStock] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showMessage = (msg: string, type: 'success' | 'error' | '') => {
    setMessage(msg);
    setMessageType(type);

    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }

    if (type === 'success') {
      messageTimeoutRef.current = setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 3000);
    }
  };

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  };

  useEffect(() => {
    try {
      const app = initializeApp(firebaseConfig);
      const firestore = getFirestore(app);
      const firebaseAuth = getAuth(app);

      setDb(firestore);
      setAuth(firebaseAuth);

      const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
        if (user) {
          setUserId(user.uid);
          console.log('User signed in:', user.uid);
        } else {
          try {
            if (initialAuthToken) {
              await signInWithCustomToken(firebaseAuth, initialAuthToken);
              console.log('Signed in with custom token.');
            } else {
              await signInAnonymously(firebaseAuth);
              console.log('Signed in anonymously.');
            }
          } catch (error: unknown) {
            console.error('Error signing in:', error);
            showMessage('Error signing in: ' + getErrorMessage(error), 'error');
          }
        }
        setIsLoading(false);
      });

      return () => unsubscribe();
    } catch (error: unknown) {
      console.error("Firebase initialization error:", error);
      showMessage("Failed to initialize Firebase. Check console for details: " + getErrorMessage(error), 'error');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (db && userId) {
      const userStocksDocRef = doc(db, `artifacts/${appId}/users/${userId}/userStocks/trackedStocksDoc`);

      const unsubscribe = onSnapshot(userStocksDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTrackedStocks(data.stocks || []);
          console.log('Tracked stocks loaded:', data.stocks);
        } else {
          setTrackedStocks([]);
          console.log('No tracked stocks found for user.');
        }
      }, (error: unknown) => {
        console.error("Error fetching tracked stocks:", error);
        showMessage("Error loading tracked stocks: " + getErrorMessage(error), 'error');
      });

      return () => unsubscribe();
    }
  }, [db, userId, appId]);

  useEffect(() => {
    if (db && userId) {
      const alertsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/userAlerts`);
      
      const unsubscribe = onSnapshot(alertsCollectionRef, (snapshot) => {
        const alerts: Alert[] = [];
        snapshot.forEach((doc) => {
          alerts.push({ id: doc.id, ...doc.data() as Omit<Alert, 'id'> });
        });
        alerts.sort((a, b) => new Date(b.alertTimestamp).getTime() - new Date(a.alertTimestamp).getTime());
        setUserAlerts(alerts);
        console.log('User alerts loaded:', alerts);
      }, (error: unknown) => {
        console.error("Error fetching user alerts:", error);
        showMessage("Error loading alerts: " + getErrorMessage(error), 'error');
      });

      return () => unsubscribe();
    }
  }, [db, userId, appId]);

  const addStock = async () => {
    if (!newStock.trim()) {
      showMessage('Stock ticker cannot be empty.', 'error');
      return;
    }
    if (trackedStocks.length >= 5) {
      showMessage('You can track a maximum of 5 stocks.', 'error');
      return;
    }
    const normalizedNewStock = newStock.trim().toUpperCase();
    if (trackedStocks.includes(normalizedNewStock)) {
      showMessage('This stock is already being tracked.', 'error');
      return;
    }

    if (!db || !userId) {
        showMessage('Firebase not initialized or user not authenticated.', 'error');
        return;
    }

    try {
      const userDocRef = doc(db, `artifacts/${appId}/users/${userId}`);
      await setDoc(userDocRef, { lastActive: new Date().toISOString() }, { merge: true });
      console.log('User document created/updated:', userId);

      const userStocksDocRef = doc(db, `artifacts/${appId}/users/${userId}/userStocks/trackedStocksDoc`);
      const updatedStocks = [...trackedStocks, normalizedNewStock];
      await setDoc(userStocksDocRef, {
        userId: userId,
        stocks: updatedStocks,
        lastUpdated: new Date().toISOString()
      }, { merge: true });
      setNewStock('');
      showMessage(`'${normalizedNewStock}' added successfully!`, 'success');
    } catch (error: unknown) {
      console.error('Error adding stock:', error);
      showMessage('Error adding stock: ' + getErrorMessage(error), 'error');
    }
  };

  const removeStock = async (stockToRemove: string) => {
    if (!db || !userId) {
        showMessage('Firebase not initialized or user not authenticated.', 'error');
        return;
    }

    const updatedStocks = trackedStocks.filter(stock => stock !== stockToRemove);
    try {
      const userStocksDocRef = doc(db, `artifacts/${appId}/users/${userId}/userStocks/trackedStocksDoc`);
      await setDoc(userStocksDocRef, {
        userId: userId,
        stocks: updatedStocks,
        lastUpdated: new Date().toISOString()
      }, { merge: true });
      showMessage(`'${stockToRemove}' removed successfully.`, 'success');
    } catch (error: unknown) {
      console.error('Error removing stock:', error);
      showMessage('Error removing stock: ' + getErrorMessage(error), 'error');
    }
  };

  const formatAlertTimestamp = (timestamp: string) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-lg font-semibold text-gray-700">Loading Tradr App...</div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg shadow-inner">
      <h1 className="text-3xl sm:text-4xl font-bold text-center text-indigo-700 mb-6">
        📈 My Tracked Stocks & Alerts
      </h1>

      {userId && (
        <div className="mb-6 text-center text-sm text-gray-600">
          Your User ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded-md break-all">{userId}</span>
        </div>
      )}

      {message && (
        <div className={`
          ${messageType === 'success' ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700'}
          px-4 py-3 rounded-lg relative mb-6 border
        `} role="alert">
          <span className="block sm:inline">{message}</span>
          {/* Only show close button for error messages */}
          {messageType === 'error' && (
            <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => showMessage('', '')}>
              <svg className="fill-current h-6 w-6 text-red-500 block" width="24" height="24" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.697l-2.651 2.652a1.2 1.2 0 1 1-1.697-1.697L8.303 10 5.651 7.348a1.2 1.2 0 0 1 1.697-1.697L10 8.303l2.651-2.652a1.2 1.2 0 0 1 1.697 1.697L11.697 10l2.651 2.651a1.2 1.2 0 0 1 0 1.698z"/></svg>
            </span>
          )}
        </div>
      )}

      {/* Stock Tracking Section */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg shadow-inner">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Add a Stock to Track (Max 5)</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            className="flex-grow p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition duration-200"
            placeholder="e.g., AAPL, MSFT"
            value={newStock}
            onChange={(e) => setNewStock(e.target.value)}
            onKeyPress={(e) => { if (e.key === 'Enter') addStock(); }}
            maxLength={10}
          />
          <button
            onClick={addStock}
            disabled={!userId || trackedStocks.length >= 5}
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Stock
          </button>
        </div>
        {trackedStocks.length >= 5 && (
          <p className="text-sm text-red-500 mt-2">Maximum 5 stocks tracked. Remove one to add more.</p>
        )}
      </div>

      <div className="mb-8 p-4 bg-gray-50 rounded-lg shadow-inner">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Currently Tracked Stocks ({trackedStocks.length}/5)</h2>
        {trackedStocks.length === 0 ? (
          <p className="text-gray-500 italic">No stocks are being tracked yet. Add some above!</p>
        ) : (
          <ul className="space-y-3">
            {trackedStocks.map((stock) => (
              <li
                key={stock}
                className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-gray-200"
              >
                <span className="font-bold text-lg text-indigo-800">{stock}</span>
                <button
                  onClick={() => removeStock(stock)}
                  className="px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 transition duration-200"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Daily Alerts Section */}
      <div className="p-4 bg-gray-50 rounded-lg shadow-inner">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Daily Alerts</h2>
        {userAlerts.length === 0 ? (
          <p className="text-gray-500 italic">No alerts yet. Your backend will generate these daily!</p>
        ) : (
          <ul className="space-y-3">
            {userAlerts.map((alert) => (
              <li
                key={alert.id}
                className={`p-3 rounded-lg shadow-sm border ${
                  alert.alertType === 'significant_increase' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-lg">{alert.stockTicker}</span>
                  <span className="text-sm text-gray-600">{formatAlertTimestamp(alert.alertTimestamp)}</span>
                </div>
                <p className="text-gray-800 mb-1">
                  {alert.alertType === 'significant_increase' ? '📈 Increased by' : '📉 Dropped by'}{' '}
                  <span className="font-semibold">
                    {alert.percentageChange ? alert.percentageChange.toFixed(2) : 'N/A'}%
                  </span>{' '}
                  over {alert.periodDays} day(s).
                </p>
                <p className="text-sm text-gray-700">
                  Current Price: ${alert.currentPrice ? alert.currentPrice.toFixed(2) : 'N/A'}
                </p>
                {alert.message && (
                  <p className="text-xs text-gray-500 mt-1">{alert.message}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default StockTrackerAndAlerts;
