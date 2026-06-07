import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, getDoc, setDoc, collection, addDoc, query, where, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCeGnBkyjYnAjsbk7-Mapa6iLM2MF39Rn4",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "madmanrep-e297d.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "madmanrep-e297d",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "madmanrep-e297d.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "763684609463",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:763684609463:web:ec124f2e4662497e959c32",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Export Firestore functions
export { doc, getDoc, setDoc, collection, addDoc, query, where, getDocs, updateDoc, deleteDoc };

// Connect to emulators in development (DISABLED - using real Firebase)
// if (import.meta.env.DEV) {
//   connectAuthEmulator(auth, 'http://localhost:9099');
//   connectFirestoreEmulator(db, 'localhost', 8080);
//   connectFunctionsEmulator(functions, 'localhost', 5001);
// }

export default app;
