// firebase.js

import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

// ⚠️ Analytics optional (Vercel এ error এড়ানোর জন্য safe import)
let analytics = null;

const firebaseConfig = {
  apiKey: "AIzaSyAQ1wNehf7efchAliA1ZTJdnKEiqbTww08",
  authDomain: "novaplus-app.firebaseapp.com",
  projectId: "novaplus-app",
  storageBucket: "novaplus-app.firebasestorage.app",
  messagingSenderId: "967183591469",
  appId: "1:967183591469:web:dc4a5e01aa767bf265b0a4",
  measurementId: "G-4QXRE8K8KY"
};

// 🔥 INIT
const app = initializeApp(firebaseConfig);

// 🔥 STORAGE
export const storage = getStorage(app);

// 🔥 ANALYTICS (only browser)
if (typeof window !== "undefined") {
  import("firebase/analytics")
    .then(({ getAnalytics }) => {
      analytics = getAnalytics(app);
    })
    .catch(() => {
      console.log("Analytics not supported");
    });
}

export { app, analytics };
