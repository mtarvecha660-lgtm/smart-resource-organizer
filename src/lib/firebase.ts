// File: src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  Firestore,
  doc,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

/**
 * Initialize Firestore with multi-tab persistent local cache and
 * force long-polling for resilient proxy/iframe compatibility.
 */
let firestoreInstance: Firestore;
const targetDatabaseId = firebaseConfig.firestoreDatabaseId || undefined;

try {
  firestoreInstance = initializeFirestore(
    app,
    {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
      experimentalForceLongPolling: true,
    },
    targetDatabaseId
  );
} catch {
  try {
    firestoreInstance = initializeFirestore(
      app,
      {
        experimentalForceLongPolling: true,
      },
      targetDatabaseId
    );
  } catch {
    firestoreInstance = firebaseConfig.firestoreDatabaseId
      ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
      : getFirestore(app);
  }
}

export const db = firestoreInstance;

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: unknown) {
    if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('unavailable'))) {
      console.warn('Firestore is running in offline cache mode.');
    }
  }
}
testConnection();

export { signInWithPopup, signOut };
