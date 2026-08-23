import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    // For local development, if you don't provide credentials, it will try to use
    // Application Default Credentials (ADC).
    // In production (Vercel), you can set a FIREBASE_SERVICE_ACCOUNT_KEY env var
    // containing the JSON stringified service account.
    
    let credential = admin.credential.applicationDefault();

    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      credential = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY));
    }

    admin.initializeApp({
      credential,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
