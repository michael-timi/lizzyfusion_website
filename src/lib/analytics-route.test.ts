import { describe, expect, it } from "vitest";
import {
  checkoutFunnelStep,
  classifyAnalyticsArea,
  inferWhatsappLocation,
  productSlugFromPath,
} from "@/lib/analytics-route";

describe("classifyAnalyticsArea", () => {
  it("classifies admin, checkout, shop, auth, and content", () => {
    expect(classifyAnalyticsArea("/admin/catalog")).toBe("admin");
    expect(classifyAnalyticsArea("/checkout/payment")).toBe("checkout");
    expect(classifyAnalyticsArea("/cart")).toBe("checkout");
    expect(classifyAnalyticsArea("/shop")).toBe("shop");
    expect(classifyAnalyticsArea("/shop/foo")).toBe("shop");
    expect(classifyAnalyticsArea("/login")).toBe("auth");
    expect(classifyAnalyticsArea("/blog/post")).toBe("content");
    expect(classifyAnalyticsArea("/lookbook")).toBe("content");
    expect(classifyAnalyticsArea("/about")).toBe("storefront");
  });
});

describe("checkoutFunnelStep", () => {
  it("maps checkout paths", () => {
    expect(checkoutFunnelStep("/cart")).toBe("cart");
    expect(checkoutFunnelStep("/checkout/info")).toBe("info");
    expect(checkoutFunnelStep("/checkout/success")).toBe("success");
    expect(checkoutFunnelStep("/shop")).toBeNull();
  });
});

describe("inferWhatsappLocation", () => {
  it("infers location from pathname", () => {
    expect(inferWhatsappLocation("/shop/abaya")).toBe("pdp");
    expect(inferWhatsappLocation("/contact")).toBe("contact");
    expect(inferWhatsappLocation("/")).toBe("home");
  });
});

describe("productSlugFromPath", () => {
  it("extracts PDP slug", () => {
    expect(productSlugFromPath("/shop/signature-abaya")).toBe("signature-abaya");
    expect(productSlugFromPath("/shop")).toBeUndefined();
  });
});
