"use client";

import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import type { Unsubscribe } from "firebase/firestore";
import type { FirestoreOrderDoc, OrderStatus } from "@/lib/admin-types";
import { isOrderStatus } from "@/lib/admin-types";
import { getFirebaseDb } from "@/lib/firebase-db";
import type { UserProfileDoc } from "@/lib/firebase-user-profile";

const ORDERS_PAGE = 150;
const USERS_PAGE = 300;

export function subscribeAdminOrders(
  onData: (rows: { id: string; data: FirestoreOrderDoc }[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe | null {
  const db = getFirebaseDb();
  if (!db) {
    onError?.(new Error("Firestore is not configured."));
    return null;
  }
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(ORDERS_PAGE));
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, data: d.data() as FirestoreOrderDoc }));
      onData(rows);
    },
    (e) => onError?.(e instanceof Error ? e : new Error(String(e))),
  );
}

export function subscribeAdminUsers(
  onData: (rows: { id: string; data: UserProfileDoc }[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe | null {
  const db = getFirebaseDb();
  if (!db) {
    onError?.(new Error("Firestore is not configured."));
    return null;
  }
  const q = query(collection(db, "users"), limit(USERS_PAGE));
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, data: d.data() as UserProfileDoc }));
      onData(rows);
    },
    (e) => onError?.(e instanceof Error ? e : new Error(String(e))),
  );
}

/** One-shot fetch when snapshot subscriptions are not needed (e.g. stats). */
export async function fetchAdminOrderCount(): Promise<number> {
  const db = getFirebaseDb();
  if (!db) return 0;
  const snap = await getDocs(query(collection(db, "orders"), limit(500)));
  return snap.size;
}

export async function fetchAdminUserCount(): Promise<number> {
  const db = getFirebaseDb();
  if (!db) return 0;
  const snap = await getDocs(query(collection(db, "users"), limit(500)));
  return snap.size;
}

export async function fetchAdminCatalogCount(): Promise<number> {
  const db = getFirebaseDb();
  if (!db) return 0;
  const snap = await getDocs(query(collection(db, "catalog_products"), limit(500)));
  return snap.size;
}

export async function updateOrderAdminFields(
  orderId: string,
  patch: { status: OrderStatus | string; adminNote?: string },
): Promise<{ ok: true } | { ok: false; message: string }> {
  const db = getFirebaseDb();
  if (!db) return { ok: false, message: "Firestore is not configured." };
  const status = isOrderStatus(patch.status) ? patch.status : "submitted";
  try {
    await updateDoc(doc(db, "orders", orderId), {
      status,
      ...(patch.adminNote !== undefined ? { adminNote: patch.adminNote } : {}),
      updatedAt: serverTimestamp(),
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Update failed." };
  }
}

export function formatFirestoreTime(value: FirestoreOrderDoc["createdAt"]): string {
  if (!value || typeof value.toMillis !== "function") return "—";
  try {
    return new Date(value.toMillis()).toLocaleString("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}
