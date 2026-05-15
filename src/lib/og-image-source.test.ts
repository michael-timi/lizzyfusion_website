import { describe, expect, it } from "vitest";
import { normalizeFirebaseStorageDownloadUrl } from "@/lib/og-image-source";

describe("normalizeFirebaseStorageDownloadUrl", () => {
  it("encodes object path slashes for Firebase Storage REST URLs", () => {
    const raw =
      "https://firebasestorage.googleapis.com/v0/b/lizzy-fusion.firebasestorage.app/o/users/uid/catalog_product_images/slug/hero.png?alt=media&token=abc";
    expect(normalizeFirebaseStorageDownloadUrl(raw)).toBe(
      "https://firebasestorage.googleapis.com/v0/b/lizzy-fusion.firebasestorage.app/o/users%2Fuid%2Fcatalog_product_images%2Fslug%2Fhero.png?alt=media&token=abc",
    );
  });

  it("leaves already-encoded paths unchanged", () => {
    const encoded =
      "https://firebasestorage.googleapis.com/v0/b/bucket/o/users%2Fuid%2Fhero.png?alt=media";
    expect(normalizeFirebaseStorageDownloadUrl(encoded)).toBe(encoded);
  });
});
