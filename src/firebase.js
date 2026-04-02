// firebase.js

// 🔥 Import core
import { initializeApp } from "firebase/app";

// 🔥 Storage (for video/audio upload)
import { getStorage } from "firebase/storage";

// 🔥 Analytics (optional)
import { getAnalytics } from "firebase/analytics";

// -----------------------
// 🔥 CONFIG
// -----------------------
const firebaseConfig = {
  apiKey: "AIzaSyAQ1wNehf7efchAliA1ZTJdnKEiqbTww08",
  authDomain: "novaplus-app.firebaseapp.com",
  projectId: "novaplus-app",
  storageBucket: "novaplus-app.firebasestorage.app",
  messagingSenderId: "967183591469",
  appId: "1:967183591469:web:dc4a5e01aa767bf265b0a4",
  measurementId: "G-4QXRE8K8KY"
};

// -----------------------
// 🔥 INIT
// -----------------------
const app = initializeApp(firebaseConfig);

// 🔥 STORAGE EXPORT
export const storage = getStorage(app);

// 🔥 ANALYTICS (optional)
let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

export { app, analytics };
