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
  authDomain: "say-less-ai.firebaseapp.com",
  projectId: "say-less-ai",
  storageBucket: "say-less-ai.appspot.com",
  messagingSenderId: "532924917005",
  appId: "1:532924917005:web:897ed21df12c61ddd6fc44",
  measurementId: "G-QMM042N7JT",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
const database = getFirestore(app);
const analytics = getAnalytics(app);

export { database };
