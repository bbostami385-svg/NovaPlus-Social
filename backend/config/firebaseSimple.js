import admin from 'firebase-admin';

const getServiceAccount = () => {
  // Try Base64 encoded service account first (recommended)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    try {
      let base64String = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
      // Remove any whitespace/newlines from Base64 string
      base64String = base64String.replace(/\s/g, '');
      const jsonString = Buffer.from(base64String, 'base64').toString('utf-8');
      const serviceAccount = JSON.parse(jsonString);
      console.log('✅ Loaded Firebase service account from Base64');
      return serviceAccount;
    } catch (error) {
      console.warn('⚠️  Failed to decode Base64 service account:', error.message);
    }
  }

  // Fallback to individual environment variables
  const serviceAccount = {
    type: 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
    token_uri: process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
  };
  return serviceAccount;
};

const initializeFirebaseAdmin = () => {
  try {
    // Check if Firebase is already initialized
    if (admin.apps.length > 0) {
      console.log('✅ Firebase already initialized');
      return admin;
    }

    console.log('📝 Initializing Firebase Admin SDK...');

    const serviceAccount = getServiceAccount();

    // Validate required fields
    if (!serviceAccount.project_id) {
      throw new Error('Firebase project_id is not set. Use FIREBASE_SERVICE_ACCOUNT_BASE64 or FIREBASE_PROJECT_ID');
    }
    if (!serviceAccount.private_key) {
      throw new Error('Firebase private_key is not set. Use FIREBASE_SERVICE_ACCOUNT_BASE64 or FIREBASE_PRIVATE_KEY');
    }
    if (!serviceAccount.client_email) {
      throw new Error('Firebase client_email is not set. Use FIREBASE_SERVICE_ACCOUNT_BASE64 or FIREBASE_CLIENT_EMAIL');
    }

    // Handle private_key newline characters
    if (serviceAccount.private_key && typeof serviceAccount.private_key === 'string') {
      // Replace literal \n with actual newlines
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    // Initialize Firebase Admin SDK
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });

    console.log('✅ Firebase Admin SDK initialized successfully!');
    console.log(`   Project: ${serviceAccount.project_id}`);
    return admin;
    
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    console.warn('⚠️  Continuing without Firebase. Some features may not work.');
    return null;
  }
};

export default initializeFirebaseAdmin;
