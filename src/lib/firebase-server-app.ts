import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { readFirebaseWebConfig } from "@/lib/firebase";

let cached: FirebaseApp | null | undefined;

/**
 * Firebase app for **Node / Route Handlers / RSC** (not the browser).
 * Uses the same web config as the client SDK. Returns null if env is missing.
 */
export function getFirebaseAppServer(): FirebaseApp | null {
  if (typeof window !== "undefined") return null;
  if (cached !== undefined) return cached;
  const config = readFirebaseWebConfig();
  if (!config) {
    cached = null;
    return null;
  }
  try {
    cached = getApps().length > 0 ? getApp() : initializeApp(config);
    return cached;
  } catch {
    cached = null;
    return null;
  }
}
