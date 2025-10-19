import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDmo1epgFbF3cQZvnJYhDBZ8-5shTCufdQ",
  authDomain: "apple-aporte-2699f.firebaseapp.com",
  projectId: "apple-aporte-2699f",
  storageBucket: "apple-aporte-2699f.firebasestorage.app",
  messagingSenderId: "485593168413",
  appId: "1:485593168413:web:ca8d420caa2bd7e764e4f4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
