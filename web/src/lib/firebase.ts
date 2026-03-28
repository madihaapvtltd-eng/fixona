import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, getDoc, setDoc, collection, addDoc, query, where, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyCeGnBkyjYnAjsbk7-Mapa6iLM2MF39Rn4",
  authDomain: "madmanrep-e297d.firebaseapp.com",
  projectId: "madmanrep-e297d",
  storageBucket: "madmanrep-e297d.firebasestorage.app",
  messagingSenderId: "763684609463",
  appId: "1:763684609463:web:ec124f2e4662497e959c32",
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
