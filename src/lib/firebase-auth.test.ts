import { FirebaseError } from "firebase/app";
import { describe, expect, it } from "vitest";
import { firebaseAuthErrorMessage } from "./firebase-auth";

describe("firebaseAuthErrorMessage", () => {
  it("maps known auth codes", () => {
    expect(firebaseAuthErrorMessage(new FirebaseError("auth/weak-password", "x"))).toContain("6");
    expect(firebaseAuthErrorMessage(new FirebaseError("auth/invalid-email", "x"))).toContain("valid");
  });

  it("falls back for unknown Error", () => {
    expect(firebaseAuthErrorMessage(new Error("oops"))).toBe("oops");
  });
});
