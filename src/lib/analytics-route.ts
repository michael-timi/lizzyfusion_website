/** Route classification for GA4 `page_view` context (no Firebase imports). */

export type AnalyticsArea =
  | "storefront"
  | "shop"
  | "checkout"
  | "auth"
  | "content"
  | "admin"
  | "other";

export type CheckoutFunnelStep = "cart" | "info" | "shipping" | "payment" | "success" | "failure";

export function classifyAnalyticsArea(pathname: string): AnalyticsArea {
  const path = pathname.split("?")[0] ?? pathname;
  if (path.startsWith("/admin")) return "admin";
  if (path.startsWith("/checkout")) return "checkout";
  if (path === "/cart") return "checkout";
  if (path.startsWith("/login") || path.startsWith("/register") || path.startsWith("/forgot-password")) {
    return "auth";
  }
  if (path.startsWith("/shop")) return "shop";
  if (path.startsWith("/blog") || path === "/lookbook") return "content";
  return "storefront";
}

export function checkoutFunnelStep(pathname: string): CheckoutFunnelStep | null {
  const path = pathname.split("?")[0] ?? pathname;
  if (path === "/cart") return "cart";
  if (path === "/checkout/info") return "info";
  if (path === "/checkout/shipping") return "shipping";
  if (path === "/checkout/payment") return "payment";
  if (path === "/checkout/success") return "success";
  if (path === "/checkout/failure") return "failure";
  return null;
}

/** Infer WhatsApp click location from pathname when `data-lf-analytics` is absent. */
export function inferWhatsappLocation(pathname: string): string {
  const path = pathname.split("?")[0] ?? pathname;
  if (path.startsWith("/shop/") && path !== "/shop") return "pdp";
  if (path === "/shop") return "shop_grid";
  if (path === "/cart") return "cart";
  if (path.startsWith("/checkout")) return "checkout";
  if (path === "/contact") return "contact";
  if (path === "/wishlist") return "wishlist";
  if (path === "/") return "home";
  if (path.startsWith("/blog")) return "blog";
  if (path === "/lookbook") return "lookbook";
  if (path.startsWith("/custom")) return "custom";
  if (path.startsWith("/training") || path.startsWith("/apprentice")) return "training";
  return "site";
}

export function productSlugFromPath(pathname: string): string | undefined {
  const match = /^\/shop\/([^/]+)\/?$/.exec(pathname.split("?")[0] ?? pathname);
  return match?.[1];
}
