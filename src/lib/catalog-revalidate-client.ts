"use client";

import type { User } from "firebase/auth";

/**
 * Tell the server to invalidate the catalogue cache after a Firestore write. Called by the admin
 * add / edit / delete views so newly published or removed products appear on the storefront
 * immediately instead of after the `unstable_cache` TTL.
 *
 * Best-effort: a failed revalidation should not block the admin flow (Firestore is the truth and
 * the cache will refresh on its own within a few minutes). Returns whether the call succeeded.
 */
export async function requestCatalogRevalidation(user: User, slug?: string): Promise<boolean> {
  try {
    const idToken = await user.getIdToken();
    const res = await fetch("/api/admin/catalog/revalidate", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(slug ? { slug } : {}),
    });
    return res.ok;
  } catch {
    return false;
  }
}
