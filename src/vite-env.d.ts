/// <reference types="vite/client" />

declare global {
  const __firebase_config: string;
  const __app_id: string;
  const __initial_auth_token: string | null;

  // Extend process.env for Vite's VITE_ prefixed environment variables
  namespace NodeJS {
    interface ProcessEnv {
      VITE_FIREBASE_API_KEY: string;
      VITE_FIREBASE_AUTH_DOMAIN: string;
      VITE_FIREBASE_PROJECT_ID: string;
      VITE_FIREBASE_STORAGE_BUCKET: string;
      VITE_FIREBASE_MESSAGING_SENDER_ID: string;
      VITE_FIREBASE_APP_ID: string;
      VITE_FIREBASE_MEASUREMENT_ID: string;
    }
  }
}