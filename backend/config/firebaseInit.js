import admin from 'firebase-admin';

const initializeFirebaseAdmin = () => {
  try {
    // Check if Firebase is already initialized
    if (admin.apps.length > 0) {
      console.log('✅ Firebase already initialized');
      return admin;
    }

    let serviceAccount = null;
    
    // Method 1: Try to parse JSON string from environment
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        let jsonString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        console.log('📝 Attempting to parse FIREBASE_SERVICE_ACCOUNT_KEY...');
        
        // Handle escaped newlines
        jsonString = jsonString.replace(/\\n/g, '\n');
        
        // Try to parse
        serviceAccount = JSON.parse(jsonString);
        
        // Validate
        if (!serviceAccount.project_id) {
          throw new Error('Parsed JSON missing project_id');
        }
        
        console.log('✅ Successfully parsed Firebase service account from JSON string');
        console.log(`   Project ID: ${serviceAccount.project_id}`);
      } catch (parseError) {
        console.warn('⚠️  Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', parseError.message);
        console.warn('   Trying alternative parsing methods...');
        
        // Try alternative: maybe it's already an object
        try {
          if (typeof process.env.FIREBASE_SERVICE_ACCOUNT_KEY === 'object') {
            serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
            console.log('✅ Firebase service account loaded as object');
          }
        } catch (e) {
          console.warn('   Alternative parsing also failed');
        }
      }
    }
    
    // Method 2: Try individual environment variables
    if (!serviceAccount) {
      console.log('📝 Attempting to build service account from individual environment variables...');
      
      const requiredFields = [
        'FIREBASE_PROJECT_ID',
        'FIREBASE_PRIVATE_KEY_ID',
        'FIREBASE_PRIVATE_KEY',
        'FIREBASE_CLIENT_EMAIL',
        'FIREBASE_CLIENT_ID',
        'FIREBASE_AUTH_URI',
        'FIREBASE_TOKEN_URI',
        'FIREBASE_AUTH_PROVIDER_CERT_URL',
        'FIREBASE_CLIENT_CERT_URL'
      ];
      
      const missingFields = requiredFields.filter(field => !process.env[field]);
      
      if (missingFields.length > 0) {
        console.warn(`⚠️  Missing Firebase environment variables: ${missingFields.join(', ')}`);
      } else {
        console.log('✅ All individual Firebase environment variables found');
      }
      
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
      
      if (serviceAccount.project_id) {
        console.log('✅ Service account built from individual environment variables');
        console.log(`   Project ID: ${serviceAccount.project_id}`);
      }
    }
    
    // Final validation
    console.log('\n📋 Final validation:');
    console.log(`   - project_id: ${serviceAccount?.project_id ? '✅' : '❌'}`);
    console.log(`   - private_key: ${serviceAccount?.private_key ? '✅' : '❌'}`);
    console.log(`   - client_email: ${serviceAccount?.client_email ? '✅' : '❌'}`);
    
    if (!serviceAccount || !serviceAccount.project_id) {
      throw new Error(
        'Firebase project_id is missing. Please set either:\n' +
        '1. FIREBASE_SERVICE_ACCOUNT_KEY environment variable with complete JSON, OR\n' +
        '2. Individual Firebase environment variables (FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, etc.)\n\n' +
        'Current values:\n' +
        `   FIREBASE_SERVICE_ACCOUNT_KEY: ${process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? 'SET' : 'NOT SET'}\n` +
        `   FIREBASE_PROJECT_ID: ${process.env.FIREBASE_PROJECT_ID ? 'SET' : 'NOT SET'}`
      );
    }
    
    if (!serviceAccount.private_key) {
      throw new Error('Firebase private_key is missing from service account');
    }

    // Initialize Firebase Admin SDK
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });

    console.log('\n✅ Firebase Admin SDK initialized successfully!');
    console.log(`   Project: ${serviceAccount.project_id}`);
    return admin;
    
  } catch (error) {
    console.error('\n❌ Firebase initialization error:', error.message);
    console.error('📋 Error details:', error.stack);
    console.warn('\n⚠️  Continuing without Firebase. Some features may not work.');
    return null;
  }
};

export default initializeFirebaseAdmin;
