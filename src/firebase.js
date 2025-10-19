// Replace the firebaseConfig object below with your project's config.
// Where to get it:
// 1. Open https://console.firebase.google.com/
// 2. Select your project (e.g., Apple-aporte)
// 3. Click the gear icon -> Project settings -> scroll to "Your apps"
// 4. Select the web app and copy the firebaseConfig object.
// 5. Paste it below, replacing the placeholder values.
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME.firebaseapp.com",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME.appspot.com",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
