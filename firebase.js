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

import firebaseConfig from './firebase-applet-config.json';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

export const USE_FIREBASE = true; // Set to true after adding your config

let app = null;
let auth = null;
let db = null;
let storage = null;
let analytics = null;

export async function initFirebase() {
  if (!USE_FIREBASE) return;
  
  try {
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

export async function uploadVideoToFirebase(matchId, file) {
  if (!USE_FIREBASE || !storage) {
    console.warn('Firebase Storage is disabled or not initialized.');
    return null;
  }
  try {
    const storageRef = ref(storage, `videos/${matchId}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {
    console.error('Firebase Storage upload failed:', error);
    throw error;
  }
}

