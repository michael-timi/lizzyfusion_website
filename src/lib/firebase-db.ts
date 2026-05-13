import { getFirestore, type Firestore } from "firebase/firestore";
import { getFirebaseApp } from "@/lib/firebase";

let firestoreInstance: Firestore | null = null;

/**
 * Firestore client (browser only — `getFirebaseApp()` is null on the server).
 * Create the default database in the Firebase console, deploy `firestore.rules`,
 * and ensure `NEXT_PUBLIC_FIREBASE_*` (or `FIREBASE_WEBAPP_CONFIG`) is set.
 */
export function getFirebaseDb(): Firestore | null {
  const app = getFirebaseApp();
  if (!app) return null;
  if (!firestoreInstance) firestoreInstance = getFirestore(app);
  return firestoreInstance;
}
