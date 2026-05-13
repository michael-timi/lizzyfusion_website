import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { getFirebaseApp } from "@/lib/firebase";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
googleProvider.addScope("email");
googleProvider.addScope("profile");

export function getFirebaseAuth() {
  const app = getFirebaseApp();
  if (!app) return null;
  return getAuth(app);
}

export async function signInWithGoogle(): Promise<User> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase is not configured. Add your web app keys to .env.local.");
  const { user } = await signInWithPopup(auth, googleProvider);
  return user;
}

/** Dispatched on `window` after `signOutUser()` completes (browser only). */
export const LF_SIGNED_OUT_EVENT = "lf-signed-out";

export async function signOutUser(): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth) return;
  await signOut(auth);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(LF_SIGNED_OUT_EVENT));
  }
}

export async function signInWithEmailPassword(email: string, password: string): Promise<User> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase is not configured. Add your web app keys to .env.local.");
  const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);
  return user;
}

export async function registerWithEmailPassword(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
): Promise<User> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase is not configured. Add your web app keys to .env.local.");
  const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const displayName = `${firstName.trim()} ${lastName.trim()}`.trim();
  if (displayName) await updateProfile(user, { displayName });
  await sendEmailVerification(user);
  return user;
}

export async function sendPasswordReset(email: string): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase is not configured. Add your web app keys to .env.local.");
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  if (origin) {
    await sendPasswordResetEmail(auth, email.trim(), {
      url: `${origin}/login`,
      handleCodeInApp: false,
    });
  } else {
    await sendPasswordResetEmail(auth, email.trim());
  }
}

export function firebaseAuthErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/popup-blocked":
        return "Your browser blocked the sign-in window. Allow pop-ups for this site or try again.";
      case "auth/popup-closed-by-user":
        return "Sign-in was closed before it finished. Try again when you are ready.";
      case "auth/cancelled-popup-request":
        return "Another sign-in attempt is already in progress.";
      case "auth/account-exists-with-different-credential":
        return "An account already exists with this email using a different sign-in method. Try logging in with email and password, or use Google with the same Google account.";
      case "auth/email-already-in-use":
        return "This email is already registered. Log in instead.";
      case "auth/invalid-email":
        return "That email address does not look valid.";
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Incorrect email or password.";
      case "auth/weak-password":
        return "Password is too weak. Use at least 6 characters.";
      case "auth/too-many-requests":
        return "Too many attempts. Wait a few minutes and try again.";
      default:
        return error.message || "Something went wrong with sign-in. Please try again.";
    }
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}
