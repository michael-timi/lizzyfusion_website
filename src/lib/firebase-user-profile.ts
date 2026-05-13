import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { getFirebaseDb } from "@/lib/firebase-db";

/** Stored on each profile; only trusted backends / console should set `admin`. */
export type UserType = "user" | "admin";

export type UserProfileDoc = {
  userId: string;
  email: string | null;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  userType: UserType;
  primaryProvider: string | null;
  createdAt: unknown;
  updatedAt: unknown;
};

export function splitDisplayName(displayName: string | null): {
  firstName: string | null;
  lastName: string | null;
} {
  const t = displayName?.trim() ?? "";
  if (!t) return { firstName: null, lastName: null };
  const parts = t.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0] ?? null, lastName: null };
  return { firstName: parts[0] ?? null, lastName: parts.slice(1).join(" ") || null };
}

/**
 * Creates `users/{uid}` on first sign-in, then keeps email / display / names in sync.
 * New documents always use `userType: "user"`. Promote to `admin` in Firestore console
 * or with the Firebase Admin SDK (client rules block changing `userType`).
 */
export async function syncUserProfileFromAuth(user: User): Promise<void> {
  const db = getFirebaseDb();
  if (!db) return;

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const displayName = user.displayName ?? null;
  const { firstName, lastName } = splitDisplayName(displayName);
  const primaryProvider = user.providerData[0]?.providerId ?? null;
  const email = user.email ?? null;

  if (!snap.exists()) {
    await setDoc(ref, {
      userId: user.uid,
      email,
      displayName,
      firstName,
      lastName,
      userType: "user",
      primaryProvider,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return;
  }

  const data = snap.data() as Partial<UserProfileDoc>;
  if (
    data.email === email &&
    data.displayName === displayName &&
    data.primaryProvider === primaryProvider &&
    data.firstName === firstName &&
    data.lastName === lastName
  ) {
    return;
  }

  await setDoc(
    ref,
    {
      email,
      displayName,
      firstName,
      lastName,
      primaryProvider,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

/** Optional: read your own profile (e.g. to branch on `userType` in the app). */
export async function getUserProfile(uid: string): Promise<UserProfileDoc | null> {
  const db = getFirebaseDb();
  if (!db) return null;
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return snap.data() as UserProfileDoc;
}
