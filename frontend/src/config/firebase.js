// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAQ1wNehf7efchAliA1ZTJdnKEiqbTww08",
  authDomain: "novaplus-app.firebaseapp.com",
  projectId: "novaplus-app",
  storageBucket: "novaplus-app.firebasestorage.app",
  messagingSenderId: "967183591469",
  appId: "1:967183591469:web:dc4a5e01aa767bf265b0a4",
  measurementId: "G-4QXRE8K8KY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
