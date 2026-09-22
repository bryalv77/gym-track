import { Platform } from 'react-native';
import { initializeApp, getApps, getApp } from 'firebase/app';
import * as firebaseAuthModule from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

/** Secret code entered at sign-up that grants coach (admin) privileges. */
export const COACH_SIGNUP_CODE = process.env.EXPO_PUBLIC_COACH_SIGNUP_CODE ?? 'GYM-COACH';

/** True once the placeholder config above has been replaced with real values. */
export const isFirebaseConfigured = !Object.values(firebaseConfig).some((value) =>
  value.startsWith('YOUR_'),
);

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// On native, persist the auth session in AsyncStorage. The web SDK persists
// to IndexedDB on its own, so it only needs getAuth().
/* eslint-disable @typescript-eslint/no-explicit-any */
const authApi = firebaseAuthModule as any;
let auth: firebaseAuthModule.Auth;
if (Platform.OS !== 'web' && typeof authApi.getReactNativePersistence === 'function') {
  try {
    auth = firebaseAuthModule.initializeAuth(app, {
      persistence: authApi.getReactNativePersistence(AsyncStorage),
    });
  } catch {
    auth = firebaseAuthModule.getAuth(app);
  }
} else {
  auth = firebaseAuthModule.getAuth(app);
}

export const firebaseAuth = auth;
export const db = getDatabase(app);
