"use client";

import Link from "next/link";
import { useFirebaseAuth } from "@/components/auth/firebase-auth-provider";

/**
 * Admin-only affordance on the public PDP: links to the catalog edit page for
 * this product. Renders nothing while auth/profile is resolving or for
 * non-admins, so storefront visitors never see a flash of the control.
 */
export function AdminEditProductLink({ slug }: { slug: string }) {
  const { isAdmin, loading, profileLoading } = useFirebaseAuth();
  if (loading || profileLoading || !isAdmin) return null;

  return (
    <Link
      href={`/admin/catalog/edit/${encodeURIComponent(slug)}`}
      className="mb-3 inline-flex items-center gap-1.5 self-start rounded-full border border-[var(--lf-purple)] bg-[var(--lf-purple-faint)] px-3 py-1.5 text-xs font-semibold text-[var(--lf-purple-deep)] transition hover:bg-[var(--lf-purple)] hover:text-white"
    >
      <span
        className="rounded-full bg-[var(--lf-purple-deep)] px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-white"
        aria-hidden
      >
        Admin
      </span>
      Edit product
    </Link>
  );
}
