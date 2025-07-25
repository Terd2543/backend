// config/firebase.js
const admin = require('firebase-admin');

try {
  // Parsing FIREBASE_SERVICE_ACCOUNT_KEY from environment variable
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  console.log('Firebase Admin SDK initialized successfully.');

} catch (error) {
  console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY or initialize Firebase Admin SDK:', error.message);
  // Exit the process if Firebase initialization fails due to critical error
  process.exit(1);
}

const db = admin.firestore();
const auth = admin.auth(); // สำหรับใช้ Firebase Authentication จาก Backend

module.exports = { db, auth, admin };