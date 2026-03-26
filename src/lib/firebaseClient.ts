"use client";

import { getApps, initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

function getFirebaseApp() {
  const apps = getApps();
  if (apps.length > 0) return apps[0];

  return initializeApp(firebaseConfig);
}

export const firebaseApp = getFirebaseApp();
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

export async function ensureAnonymousAuth(): Promise<{ user: import("firebase/auth").User | null; error?: Error }> {
  // Already signed in?
  const current = auth.currentUser;
  if (current) return { user: current };

  // Otherwise, sign in anonymously.
  try {
    const cred = await signInAnonymously(auth);
    return { user: cred.user };
  } catch (e) {
    // If it fails, return error so caller can handle it
    return { user: auth.currentUser ?? null, error: e as Error };
  }
}

export function onAuthReady(callback: (user: unknown) => void) {
  return onAuthStateChanged(auth, callback);
}

