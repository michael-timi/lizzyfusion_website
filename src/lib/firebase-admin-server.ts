import { existsSync, readFileSync } from "node:fs";
import admin from "firebase-admin";

/** Strip BOM, trim, and remove one accidental layer of outer quotes from .env paste mistakes. */
function normalizeCredentialJsonString(raw: string): string {
  let s = raw.trim();
  if (s.charCodeAt(0) === 0xfeff) {
    s = s.slice(1).trim();
  }
  if (
    (s.startsWith("'") && s.endsWith("'") && s.length >= 2) ||
    (s.startsWith('"') && s.endsWith('"') && s.length >= 2)
  ) {
    const inner = s.slice(1, -1).trim();
    if (inner.startsWith("{")) {
      s = inner;
    }
  }
  return s;
}

export type AdminVerifyFailure =
  | { kind: "credentials"; detail: string }
  | { kind: "token"; detail: string }
  | { kind: "not_admin"; detail: string };

/**
 * Initialize Firebase Admin once. Use either:
 * - `FIREBASE_SERVICE_ACCOUNT_PATH` or `GOOGLE_APPLICATION_CREDENTIALS` — absolute path to the downloaded `.json`
 * - `FIREBASE_SERVICE_ACCOUNT_JSON` — minified single-line JSON (only if no credential file, or file path is missing)
 *
 * If the path points to an existing file, that file wins even when `FIREBASE_SERVICE_ACCOUNT_JSON` is also set
 * (avoids broken inline JSON blocking a valid file).
 *
 * Use the **same Firebase project** as your web app (`NEXT_PUBLIC_FIREBASE_PROJECT_ID`).
 */
function getOrInitAdmin(): { app: admin.app.App | null; credHint?: string } {
  if (admin.apps.length > 0) {
    return { app: admin.app() };
  }

  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  const filePath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim() ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();

  try {
    if (filePath && existsSync(filePath)) {
      const raw = readFileSync(filePath, "utf8");
      const normalized = normalizeCredentialJsonString(raw);
      const cred = JSON.parse(normalized) as admin.ServiceAccount;
      return { app: admin.initializeApp({ credential: admin.credential.cert(cred) }) };
    }
    if (inline) {
      const normalized = normalizeCredentialJsonString(inline);
      const cred = JSON.parse(normalized) as admin.ServiceAccount;
      return { app: admin.initializeApp({ credential: admin.credential.cert(cred) }) };
    }
    if (filePath) {
      return {
        app: null,
        credHint: `Credential file not found at: ${filePath}. Use the real absolute path to your downloaded *-firebase-adminsdk-*.json (not the .env.example placeholder).`,
      };
    }
    return {
      app: null,
      credHint:
        "No Admin credentials: set FIREBASE_SERVICE_ACCOUNT_PATH=/absolute/path/to/serviceAccount.json or FIREBASE_SERVICE_ACCOUNT_JSON (one-line JSON).",
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "parse_error";
    const tip =
      "Check the file is valid Firebase service account JSON. For inline env, use one line starting with {. Remove or fix FIREBASE_SERVICE_ACCOUNT_JSON if you use FIREBASE_SERVICE_ACCOUNT_PATH.";
    return {
      app: null,
      credHint: `Invalid service account JSON or file: ${msg}. ${tip}`,
    };
  }
}

/** Returns uid when the Firebase ID token is valid and Firestore marks the user as admin. */
export async function verifyAdminFromIdToken(idToken: string): Promise<
  | { ok: true; uid: string }
  | { ok: false; failure: AdminVerifyFailure }
> {
  const { app, credHint } = getOrInitAdmin();
  if (!app) {
    return { ok: false, failure: { kind: "credentials", detail: credHint ?? "Missing Firebase Admin credentials." } };
  }

  try {
    const decoded = await admin.auth(app).verifyIdToken(idToken);
    const snap = await admin.firestore().collection("users").doc(decoded.uid).get();
    const data = snap.data();
    if (!snap.exists) {
      return {
        ok: false,
        failure: {
          kind: "not_admin",
          detail: `No Firestore document at users/${decoded.uid}. Create it or sign in with an account that has one.`,
        },
      };
    }
    if (data?.userType !== "admin") {
      return {
        ok: false,
        failure: {
          kind: "not_admin",
          detail: `Firestore users/${decoded.uid} must have userType "admin" (currently: ${String(data?.userType ?? "unset")}).`,
        },
      };
    }
    return { ok: true, uid: decoded.uid };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      failure: {
        kind: "token",
        detail: `${msg}. Same Firebase project as the web app? Service account must belong to that project.`,
      },
    };
  }
}
