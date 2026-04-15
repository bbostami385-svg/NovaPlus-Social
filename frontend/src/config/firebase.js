import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Firebase configuration (Public - safe to expose)
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

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Initialize Firebase Storage
export const storage = getStorage(app);

// Configure Google Sign-In
googleProvider.addScope('profile');
googleProvider.addScope('email');

export default app;
