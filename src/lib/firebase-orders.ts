import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import type { OrderSnapshotV1 } from "@/lib/checkout-order-snapshot";
import { getFirebaseAuth } from "@/lib/firebase-auth";
import { getFirebaseDb } from "@/lib/firebase-db";

export type SubmitOrderResult =
  | { ok: true; id: string }
  | { ok: false; error: "not_signed_in" | "no_db" | "write_failed"; message?: string };

/** Persists a checkout snapshot to Firestore `orders` (requires signed-in user). */
export async function submitOrderFromSnapshot(snapshot: OrderSnapshotV1): Promise<SubmitOrderResult> {
  const auth = getFirebaseAuth();
  const user = auth?.currentUser;
  if (!user) return { ok: false, error: "not_signed_in" };

  const db = getFirebaseDb();
  if (!db) return { ok: false, error: "no_db" };

  try {
    const shipping = JSON.parse(JSON.stringify(snapshot.shipping)) as Record<string, unknown>;
    const ref = await addDoc(collection(db, "orders"), {
      userId: user.uid,
      status: "submitted",
      createdAt: serverTimestamp(),
      contactEmail: snapshot.contactEmail,
      lines: snapshot.lines,
      totals: snapshot.totals,
      shipping,
      source: "web_checkout",
      snapshotAt: snapshot.createdAtIso,
    });
    return { ok: true, id: ref.id };
  } catch (e) {
    return {
      ok: false,
      error: "write_failed",
      message: e instanceof Error ? e.message : undefined,
    };
  }
}
