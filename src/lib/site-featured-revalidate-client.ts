"use client";

import type { User } from "firebase/auth";

/**
 * Tell the server to invalidate the storefront "Featured" pins cache after a Firestore write to
 * `site_featured/v1`. Mirrors `requestCatalogRevalidation` from `catalog-revalidate-client.ts`.
 *
 * Best-effort: a failed revalidation should not block the admin flow (Firestore is the truth and
 * the cache will refresh on its own within the TTL).
 */
export async function requestSiteFeaturedRevalidation(user: User): Promise<boolean> {
  try {
    const idToken = await user.getIdToken();
    const res = await fetch("/api/admin/site-featured/revalidate", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({}),
    });
    return res.ok;
  } catch {
    return false;
  }
}
