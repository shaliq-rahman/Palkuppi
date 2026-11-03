import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { initializeFirestore, getFirestore, persistentLocalCache, type Firestore } from "firebase/firestore";

// Fill these in .env.local (see env.example.txt). They are public web-app settings, not secrets.
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** False until the Firebase keys are in .env.local; the app then shows a setup screen instead of crashing. */
export const firebaseReady = Boolean(config.apiKey && config.projectId && config.appId);

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

export function getFirebase() {
  if (!firebaseReady) throw new Error("Firebase is not configured");
  if (!app) {
    app = getApps()[0] ?? initializeApp(config);
    authInstance = getAuth(app);
    try {
      // Keeps the app usable offline; changes sync when the connection returns.
      dbInstance = initializeFirestore(app, { localCache: persistentLocalCache() });
    } catch {
      dbInstance = getFirestore(app);
    }
  }
  return { auth: authInstance as Auth, db: dbInstance as Firestore };
}
