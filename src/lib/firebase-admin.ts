import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let app: App;

if (!getApps().length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      app = initializeApp({
        credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    } else {
      // For local dev without a service account key, use Application Default Credentials
      // Run: gcloud auth application-default login
      // OR set FIREBASE_SERVICE_ACCOUNT_KEY in .env.local
      app = initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    }
  } catch (error) {
    console.error('Firebase admin initialization error', error);
    app = getApps()[0];
  }
} else {
  app = getApps()[0];
}

export const adminAuth = getAuth(app!);
export const adminDb = getFirestore(app!);
