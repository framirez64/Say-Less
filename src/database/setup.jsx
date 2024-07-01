// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "say-less-forked-3c4d4.firebaseapp.com",
  projectId: "say-less-forked-3c4d4",
  storageBucket: "say-less-forked-3c4d4.appspot.com",
  messagingSenderId: "16866609502",
  appId: "1:16866609502:web:f80b39a9cc9c277c64a7cf",
  measurementId: "G-TFFPJRRZER",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
const database = getFirestore(app);
const analytics = getAnalytics(app);

export { database };
