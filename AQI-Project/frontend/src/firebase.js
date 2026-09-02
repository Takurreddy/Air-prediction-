import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBk0b-frtBPWsZa2nlf7zuduXSlG2QkM2k",
  authDomain: "air-aware-1f614.firebaseapp.com",
  projectId: "air-aware-1f614",
  storageBucket: "air-aware-1f614.firebasestorage.app",
  messagingSenderId: "148135147817",
  appId: "1:148135147817:web:b4f965a0caeee7ba115f38",
  measurementId: "G-NRS3S2F9T1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
