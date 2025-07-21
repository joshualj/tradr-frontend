import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  // Define the fallback Firebase config from .env variables
  const firebaseEnvConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
    measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
  };

  return {
    plugins: [react()],
    define: {
      // Ensure __firebase_config is always a JSON string.
      // If __firebase_config is defined by Canvas, it's already an object, so stringify it.
      // If it's not defined (local Vite), stringify the local env config.
      '__firebase_config': typeof __firebase_config !== 'undefined'
        ? JSON.stringify(__firebase_config) // Stringify the actual object value from Canvas
        : JSON.stringify(firebaseEnvConfig), // Stringify the local env object

      // Ensure __app_id is always a JSON string.
      // If __app_id is defined by Canvas, it's a plain string, so stringify it.
      // If it's not defined (local Vite), stringify the local env string.
      '__app_id': typeof __app_id !== 'undefined'
        ? JSON.stringify(__app_id) // Stringify the actual string value from Canvas
        : JSON.stringify(env.VITE_FIREBASE_PROJECT_ID), // Stringify the local env string

      // Ensure __initial_auth_token is always a JSON string (or "null" string).
      // If __initial_auth_token is defined by Canvas, it's a string or null, so stringify it.
      // If it's not defined (local Vite), use the "null" string.
      '__initial_auth_token': typeof __initial_auth_token !== 'undefined'
        ? JSON.stringify(__initial_auth_token) // Stringify the actual value from Canvas (string or null)
        : 'null', // Keep as 'null' string for local
    },
  };
});
