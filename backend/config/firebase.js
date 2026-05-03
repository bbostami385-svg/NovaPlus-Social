import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const initializeFirebase = () => {
  try {
    // Check if Firebase is already initialized
    if (admin.apps.length > 0) {
      console.log('✅ Firebase already initialized');
      return admin;
    }

    let serviceAccount;
    
    // Try to parse JSON string first (for Render environment)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        console.log('✅ Firebase service account loaded from JSON string');
      } catch (e) {
        console.warn('⚠️  Could not parse FIREBASE_SERVICE_ACCOUNT_KEY as JSON:', e.message);
        serviceAccount = null;
      }
    }
    
    // Fallback to individual environment variables
    if (!serviceAccount) {
      serviceAccount = {
        type: 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI,
        token_uri: process.env.FIREBASE_TOKEN_URI,
        auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
        client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
      };
    }
    
    // Validate that we have required fields
    if (!serviceAccount.project_id) {
      throw new Error('Firebase project_id is missing from service account');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });

    console.log('✅ Firebase initialized successfully');
    return admin;
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    console.warn('⚠️  Continuing without Firebase. Some features may not work.');
    return null;
  }
};

// Verify Firebase token
const verifyFirebaseToken = async (token) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    throw new Error(`Invalid Firebase token: ${error.message}`);
  }
};

// Alias for backward compatibility
const verifyFirebaseAuth = verifyFirebaseToken;

// Get Firebase user
const getFirebaseUser = async (uid) => {
  try {
    const user = await admin.auth().getUser(uid);
    return user;
  } catch (error) {
    throw new Error(`Firebase user not found: ${error.message}`);
  }
};

export { initializeFirebase, verifyFirebaseToken, verifyFirebaseAuth, getFirebaseUser };
