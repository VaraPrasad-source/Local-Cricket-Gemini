// ============================================
// FIREBASE CONFIGURATION
// ============================================
// 
// HOW TO SET UP FIREBASE:
// 
// 1. Go to https://console.firebase.google.com
// 2. Click "Add project" → Name it "local-cricket-app" → Create
// 3. In the project, click the web icon (</>) to add a web app
// 4. Register app name: "Local Cricket App"
// 5. Copy the firebaseConfig object and paste below
// 6. Enable Authentication:
//    - Go to Authentication → Sign-in method
//    - Enable "Email/Password"
//    - Enable "Google" (select a support email)
// 7. Enable Firestore:
//    - Go to Firestore Database → Create database
//    - Start in test mode (for development)
// 8. Enable Storage (for video uploads):
//    - Go to Storage → Get started
//    - Start in test mode
//
// After setup, replace the placeholder config below with your actual config.
// Then change USE_FIREBASE to true.
//
// ============================================

export const USE_FIREBASE = true; // Set to true after adding your config

const firebaseConfig = {
  apiKey: "AIzaSyDbu7eTe33ds3ncrPE_5oaH9qXiohna9II",
  authDomain: "gemini-local-cricket-app.firebaseapp.com",
  projectId: "gemini-local-cricket-app",
  storageBucket: "gemini-local-cricket-app.firebasestorage.app",
  messagingSenderId: "523544090143",
  appId: "1:523544090143:web:04c0b63f9f1fa602c4272a",
  measurementId: "G-M4B4TEN95X",
  firestoreDatabaseId: "ai-studio-498d836a-640f-41f6-9e66-0b1b35b3ec97"
};

let app = null;
let auth = null;
let db = null;
let storage = null;
let analytics = null;

export async function initFirebase() {
  if (!USE_FIREBASE) return;
  
  try {
    const { initializeApp } = await import('firebase/app');
    const { getAuth } = await import('firebase/auth');
    const { getFirestore, initializeFirestore } = await import('firebase/firestore');
    const { getStorage } = await import('firebase/storage');
    const { getAnalytics } = await import('firebase/analytics');
    
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    
    if (firebaseConfig.firestoreDatabaseId) {
      db = initializeFirestore(app, {
        databaseId: firebaseConfig.firestoreDatabaseId
      });
    } else {
      db = getFirestore(app);
    }
    
    storage = getStorage(app);
    
    try {
      analytics = getAnalytics(app);
      console.log('📊 Firebase Analytics initialized');
    } catch (e) {
      console.warn('⚠️ Firebase Analytics failed to initialize (likely blocked or not configured in environment):', e);
    }
    
    console.log('✅ Firebase initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
  }
}

export function getFirebaseAuth() { return auth; }
export function getFirebaseDB() { return db; }
export function getFirebaseStorage() { return storage; }
export function getFirebaseAnalytics() { return analytics; }
