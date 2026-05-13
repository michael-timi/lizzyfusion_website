import { NextResponse } from "next/server";
import { getMergedCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

/** Public merged catalogue for client hydration (wishlist, etc.). */
export async function GET() {
  try {
    const products = await getMergedCatalog();
    return NextResponse.json({ products });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "catalog_fetch_failed" },
      { status: 500 },
    );
  }
}
