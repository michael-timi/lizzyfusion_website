import { getFirestore, type Firestore } from "firebase/firestore";
import { getFirebaseApp } from "@/lib/firebase";

let firestoreInstance: Firestore | null = null;

/** Firestore client (browser only — `getFirebaseApp()` is null on the server). */
export function getFirebaseDb(): Firestore | null {
  const app = getFirebaseApp();
  if (!app) return null;
  if (!firestoreInstance) firestoreInstance = getFirestore(app);
  return firestoreInstance;
}
