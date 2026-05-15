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
 * Diagnostic shape for the admin UI: where the service-account credential is being read from,
 * whether it actually parses, and a remediation hint when it doesn't. Never includes the
 * credential body itself — only enough context for the admin to find and fix the env.
 */
export type AdminCredStatus =
  | { ok: true; via: "path"; path: string }
  | { ok: true; via: "json"; jsonByteLength: number }
  | { ok: false; kind: "missing"; detail: string }
  | { ok: false; kind: "path-not-found"; detail: string; path: string }
  | { ok: false; kind: "parse-error"; detail: string; via: "path" | "json"; path?: string };

/**
 * Inspect the service-account credential env without initializing firebase-admin. Safe to call
 * from Server Components rendering an admin diagnostics card.
 *
 * Reads `FIREBASE_SERVICE_ACCOUNT_PATH` / `GOOGLE_APPLICATION_CREDENTIALS` first, then falls back
 * to inline JSON in `FIREBASE_SERVICE_ACCOUNT_JSON`, matching `getOrInitAdmin`.
 */
export function describeAdminCredentials(): AdminCredStatus {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  const filePath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim() ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();

  if (filePath) {
    if (!existsSync(filePath)) {
      return {
        ok: false,
        kind: "path-not-found",
        path: filePath,
        detail:
          `Credential file not found at: ${filePath}. Use the real absolute path to your downloaded ` +
          `*-firebase-adminsdk-*.json (not the .env.example placeholder).`,
      };
    }
    try {
      const raw = readFileSync(filePath, "utf8");
      const normalized = normalizeCredentialJsonString(raw);
      JSON.parse(normalized);
      return { ok: true, via: "path", path: filePath };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "parse_error";
      return {
        ok: false,
        kind: "parse-error",
        via: "path",
        path: filePath,
        detail: `Could not read or parse the service-account JSON at ${filePath}: ${msg}.`,
      };
    }
  }

  if (inline) {
    try {
      const normalized = normalizeCredentialJsonString(inline);
      JSON.parse(normalized);
      return { ok: true, via: "json", jsonByteLength: normalized.length };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "parse_error";
      return {
        ok: false,
        kind: "parse-error",
        via: "json",
        detail:
          `Inline FIREBASE_SERVICE_ACCOUNT_JSON did not parse: ${msg}. The value must be one line ` +
          `starting with { (no quotes around it).`,
      };
    }
  }

  return {
    ok: false,
    kind: "missing",
    detail:
      "No Admin credentials found. Set FIREBASE_SERVICE_ACCOUNT_PATH=/absolute/path/to/serviceAccount.json " +
      "(preferred) or FIREBASE_SERVICE_ACCOUNT_JSON (one-line JSON) in .env.local, then restart the dev server.",
  };
}

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

/**
 * Server-side Firestore via firebase-admin. Returns null if Admin credentials are missing.
 *
 * Use this for any Server Component / Route Handler / RSC read or write — the Firebase **Web** SDK
 * is not designed for Node and can hang or return empty silently in server contexts.
 */
export function getAdminFirestore(): admin.firestore.Firestore | null {
  const { app, credHint } = getOrInitAdmin();
  if (!app) {
    if (credHint && process.env.NODE_ENV !== "production") {
      console.warn(`[firebase-admin] ${credHint}`);
    }
    return null;
  }
  return admin.firestore();
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
    if (typeof data?.userType !== "string" || data.userType.toLowerCase() !== "admin") {
      return {
        ok: false,
        failure: {
          kind: "not_admin",
          detail: `Firestore users/${decoded.uid} must have userType admin (any common casing; currently: ${String(data?.userType ?? "unset")}).`,
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
