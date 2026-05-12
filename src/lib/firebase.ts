import {
  getApp,
  getApps,
  initializeApp,
  type FirebaseApp,
  type FirebaseOptions,
} from "firebase/app";

/**
 * Web client config for the **lizzy-fusion** Firebase project.
 *
 * Local: set `NEXT_PUBLIC_*` in `.env.local` (see `.env.example`).
 * Firebase App Hosting: `FIREBASE_WEBAPP_CONFIG` is injected at build time — see
 * https://firebase.google.com/docs/app-hosting/firebase-sdks
 */
function readConfig(): FirebaseOptions | null {
  const web = process.env.FIREBASE_WEBAPP_CONFIG;
  if (web) {
    try {
      const parsed = JSON.parse(web) as FirebaseOptions;
      if (parsed?.apiKey && parsed?.projectId) return parsed;
    } catch {
      /* ignore invalid JSON */
    }
  }

  const fromEnv: FirebaseOptions = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  if (fromEnv.apiKey && fromEnv.projectId) return fromEnv;
  return null;
}

/** Firebase project ID (constant) — use when you only need the id, not full init. */
export const firebaseProjectId = "lizzy-fusion" as const;

/**
 * Returns the default Firebase app, or `null` if config is missing (e.g. CI / fresh clone).
 * Call from Client Components or event handlers; avoid using before config exists.
 */
export function getFirebaseApp(): FirebaseApp | null {
  const config = readConfig();
  if (!config) return null;
  if (getApps().length === 0) return initializeApp(config);
  return getApp();
}
