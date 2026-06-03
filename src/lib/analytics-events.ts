/**
 * Typed GA4 / Firebase Analytics events for Lizzy Fusion storefront flows.
 * Requires `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` (or `FIREBASE_WEBAPP_CONFIG` with measurementId).
 */

import { logAnalyticsEvent, type AnalyticsEventParamValue } from "@/lib/firebase-analytics";
import {
  checkoutFunnelStep,
  classifyAnalyticsArea,
  inferWhatsappLocation,
  productSlugFromPath,
} from "@/lib/analytics-route";

export type AnalyticsItem = {
  item_id: string;
  item_name: string;
  price?: number;
  quantity?: number;
  item_category?: string;
};

type EventParams = Record<string, AnalyticsEventParamValue>;

function clampString(value: string, max = 100): string {
  const t = value.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

function gaItems(items: AnalyticsItem[]): EventParams {
  return {
    items: items.map((i) => ({
      item_id: clampString(i.item_id, 64),
      item_name: clampString(i.item_name, 100),
      ...(i.price !== undefined ? { price: i.price } : {}),
      ...(i.quantity !== undefined ? { quantity: i.quantity } : {}),
      ...(i.item_category ? { item_category: clampString(i.item_category, 64) } : {}),
    })),
  };
}

function currencyValue(amount: number, currency = "NGN"): EventParams {
  return { currency, value: amount };
}

async function track(eventName: string, params?: EventParams): Promise<void> {
  await logAnalyticsEvent(eventName, params);
}

// ——— Page & session ———

export async function trackPageView(pathname: string, pageTitle: string): Promise<void> {
  const area = classifyAnalyticsArea(pathname);
  const funnel = checkoutFunnelStep(pathname);
  const slug = productSlugFromPath(pathname);
  await track("page_view", {
    page_path: pathname,
    page_title: clampString(pageTitle, 120),
    page_section: area,
    ...(funnel ? { checkout_step: funnel } : {}),
    ...(slug ? { item_id: slug } : {}),
  });
}

export async function trackCheckoutFunnelView(pathname: string): Promise<void> {
  const step = checkoutFunnelStep(pathname);
  if (!step) return;
  switch (step) {
    case "cart": {
      const cart = await readCartFunnelData();
      if (!cart) {
        await track("view_cart", { page_path: pathname });
        return;
      }
      await track("begin_checkout", {
        ...currencyValue(cart.value),
        ...gaItems(cart.items),
        item_count: cart.count,
      });
      break;
    }
    case "info": {
      const cart = await readCartFunnelData();
      await track("begin_checkout", { checkout_step: "info", ...cartParams(cart) });
      break;
    }
    case "shipping": {
      const cart = await readCartFunnelData();
      const tier = readCheckoutShippingTier();
      await track("add_shipping_info", {
        checkout_step: "shipping",
        ...(tier ? { shipping_tier: tier } : {}),
        ...cartParams(cart),
      });
      break;
    }
    case "payment": {
      const cart = await readCartFunnelData();
      await track("add_payment_info", {
        checkout_step: "payment",
        payment_type: "whatsapp",
        ...cartParams(cart),
      });
      break;
    }
    case "success":
      await track("checkout_success_view", { checkout_step: "success", transaction_method: "whatsapp" });
      break;
    case "failure":
      await track("checkout_failure", { checkout_step: "failure" });
      await trackException("checkout_failure", false);
      break;
    default:
      break;
  }
}

type CartFunnelData = { items: AnalyticsItem[]; value: number; count: number };

/** Current cart as GA item list + subtotal, or `null` when empty / unavailable. */
async function readCartFunnelData(): Promise<CartFunnelData | null> {
  if (typeof window === "undefined") return null;
  const { getCartLines } = await import("@/lib/cart");
  const { resolveCartLineDisplay } = await import("@/lib/site");
  const { checkoutTotals } = await import("@/lib/checkout-totals");
  const lines = getCartLines();
  if (lines.length === 0) return null;
  const items: AnalyticsItem[] = [];
  for (const line of lines) {
    const p = resolveCartLineDisplay(line);
    if (!p) continue;
    items.push({ item_id: p.slug, item_name: p.name, price: p.price, quantity: line.qty });
  }
  const totals = checkoutTotals(lines);
  return { items, value: totals.subtotal, count: totals.count };
}

function cartParams(cart: CartFunnelData | null): EventParams {
  if (!cart) return {};
  return { ...currencyValue(cart.value), ...gaItems(cart.items), item_count: cart.count };
}

/** Read the selected shipping method from the checkout form draft (sessionStorage, set by CheckoutProvider). */
function readCheckoutShippingTier(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = sessionStorage.getItem("lizzy-fusion-checkout-v1");
    if (!raw) return undefined;
    const o = JSON.parse(raw) as { shippingMethod?: unknown };
    return typeof o.shippingMethod === "string" ? o.shippingMethod : undefined;
  } catch {
    return undefined;
  }
}

// ——— E‑commerce ———

export async function trackAddToCart(item: AnalyticsItem): Promise<void> {
  await track("add_to_cart", {
    ...currencyValue((item.price ?? 0) * (item.quantity ?? 1)),
    ...gaItems([item]),
  });
}

export async function trackRemoveFromCart(item: AnalyticsItem): Promise<void> {
  await track("remove_from_cart", {
    ...currencyValue((item.price ?? 0) * (item.quantity ?? 1)),
    ...gaItems([item]),
  });
}

export async function trackViewItem(item: AnalyticsItem): Promise<void> {
  await track("view_item", {
    ...currencyValue(item.price ?? 0),
    ...gaItems([item]),
  });
}

export async function trackViewItemList(
  listId: string,
  items: AnalyticsItem[],
  extra?: { search_term?: string },
): Promise<void> {
  await track("view_item_list", {
    item_list_id: clampString(listId, 64),
    item_list_name: clampString(listId, 100),
    ...gaItems(items.slice(0, 30)),
    ...(extra?.search_term ? { search_term: clampString(extra.search_term, 80) } : {}),
  });
}

/** Fires when a shopper clicks through from a product list / card to the PDP. */
export async function trackSelectItem(item: AnalyticsItem, listId?: string): Promise<void> {
  await track("select_item", {
    ...(listId
      ? { item_list_id: clampString(listId, 64), item_list_name: clampString(listId, 100) }
      : {}),
    ...gaItems([item]),
  });
}

export async function trackSearch(searchTerm: string, resultCount: number): Promise<void> {
  await track("search", {
    search_term: clampString(searchTerm, 80),
    result_count: resultCount,
  });
}

export async function trackPurchase(params: {
  /** Stable id so GA4 de-duplicates repeat fires (refresh / re-entry). */
  transactionId: string;
  value: number;
  tax?: number;
  shipping?: number;
  shippingTier?: string;
  items: AnalyticsItem[];
  itemCount: number;
}): Promise<void> {
  await track("purchase", {
    transaction_id: clampString(params.transactionId, 64),
    ...currencyValue(params.value),
    ...(params.tax !== undefined ? { tax: params.tax } : {}),
    ...(params.shipping !== undefined ? { shipping: params.shipping } : {}),
    ...(params.shippingTier ? { shipping_tier: clampString(params.shippingTier, 48) } : {}),
    ...gaItems(params.items),
    item_count: params.itemCount,
    transaction_method: "whatsapp",
  });
}

// ——— Wishlist ———

export async function trackWishlistChange(slug: string, added: boolean): Promise<void> {
  await track(added ? "add_to_wishlist" : "remove_from_wishlist", {
    item_id: clampString(slug, 64),
  });
}

// ——— Auth ———

export async function trackLogin(method: "email" | "google"): Promise<void> {
  await track("login", { method });
}

export async function trackSignUp(method: "email" | "google"): Promise<void> {
  await track("sign_up", { method });
}

export async function trackLogout(): Promise<void> {
  await track("logout", {});
}

export async function trackPasswordResetRequest(): Promise<void> {
  await track("password_reset_request", {});
}

// ——— Engagement ———

export async function trackShare(params: {
  method: string;
  contentType: string;
  itemId?: string;
}): Promise<void> {
  await track("share", {
    method: clampString(params.method, 32),
    content_type: clampString(params.contentType, 32),
    ...(params.itemId ? { item_id: clampString(params.itemId, 64) } : {}),
  });
}

export async function trackWhatsappClick(location: string, itemId?: string): Promise<void> {
  await track("whatsapp_click", {
    link_location: clampString(location, 48),
    ...(itemId ? { item_id: clampString(itemId, 64) } : {}),
  });
}

export async function trackGenerateLead(formId: string, intent?: string): Promise<void> {
  await track("generate_lead", {
    form_id: clampString(formId, 48),
    ...(intent ? { intent: clampString(intent, 80) } : {}),
  });
}

export async function trackSelectContent(contentType: string, contentId: string): Promise<void> {
  await track("select_content", {
    content_type: clampString(contentType, 32),
    content_id: clampString(contentId, 64),
  });
}

// ——— Promotions (internal merchandising banners / tiles) ———

export type PromotionParams = {
  promotionId: string;
  promotionName: string;
  /** Where the promo is rendered (e.g. "home_hero", "home_collection_bento"). */
  creativeSlot?: string;
};

function promotionParams(p: PromotionParams): EventParams {
  return {
    promotion_id: clampString(p.promotionId, 64),
    promotion_name: clampString(p.promotionName, 100),
    ...(p.creativeSlot ? { creative_slot: clampString(p.creativeSlot, 48) } : {}),
  };
}

export async function trackViewPromotion(p: PromotionParams): Promise<void> {
  await track("view_promotion", promotionParams(p));
}

export async function trackSelectPromotion(p: PromotionParams): Promise<void> {
  await track("select_promotion", promotionParams(p));
}

// ——— Errors ———

/** GA4 `exception` event. `description` is truncated to GA's 150-char limit. */
export async function trackException(description: string, fatal = false): Promise<void> {
  await track("exception", {
    description: clampString(description, 150),
    fatal,
  });
}

export async function trackBlogEngagement(
  action: "like" | "comment" | "reply" | "edit" | "delete",
  postSlug: string,
): Promise<void> {
  await track("blog_engagement", {
    engagement_action: action,
    content_id: clampString(postSlug, 64),
  });
}

export async function trackLoadMore(context: string, visibleCount: number): Promise<void> {
  await track("load_more", {
    context: clampString(context, 32),
    visible_count: visibleCount,
  });
}

export async function trackFilterApply(context: string, filterSummary: string): Promise<void> {
  await track("filter_apply", {
    context: clampString(context, 32),
    filter_summary: clampString(filterSummary, 120),
  });
}

export async function trackSortApply(context: string, sortKey: string): Promise<void> {
  await track("sort_apply", {
    context: clampString(context, 32),
    sort_key: clampString(sortKey, 32),
  });
}

export async function trackMailtoClick(location: string, subject?: string): Promise<void> {
  await track("mailto_click", {
    link_location: clampString(location, 48),
    ...(subject ? { subject: clampString(subject, 80) } : {}),
  });
}

/** Document-level handler for outbound WhatsApp / mailto (set up in FirebaseClientInit). */
export function handleOutboundLinkClick(pathname: string, anchor: HTMLAnchorElement): void {
  const href = anchor.href;
  if (!href) return;
  const explicit = anchor.getAttribute("data-lf-analytics");
  if (href.includes("wa.me/") || href.includes("api.whatsapp.com")) {
    const location = explicit ?? inferWhatsappLocation(pathname);
    const slug = productSlugFromPath(pathname) ?? anchor.getAttribute("data-lf-product-slug") ?? undefined;
    void trackWhatsappClick(location, slug ?? undefined);
    return;
  }
  if (href.startsWith("mailto:")) {
    const location = explicit ?? inferWhatsappLocation(pathname);
    let subject: string | undefined;
    try {
      subject = new URL(href).searchParams.get("subject") ?? undefined;
    } catch {
      subject = undefined;
    }
    void trackMailtoClick(location, subject ?? undefined);
  }
}

/** Pathname portion of an anchor href (handles relative + absolute). */
function anchorPathname(anchor: HTMLAnchorElement): string {
  const raw = anchor.getAttribute("href") ?? "";
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) {
    try {
      return new URL(raw).pathname;
    } catch {
      return "";
    }
  }
  return raw.split(/[?#]/)[0] ?? "";
}

/**
 * Document-level handler for internal navigations: fires `select_promotion` for tagged promo links
 * (`data-lf-promo-id`) and `select_item` when a card links to a product detail page. Set up in
 * FirebaseClientInit alongside `handleOutboundLinkClick`.
 */
export function handleInternalLinkClick(pathname: string, anchor: HTMLAnchorElement): void {
  const promoId = anchor.getAttribute("data-lf-promo-id");
  if (promoId) {
    void trackSelectPromotion({
      promotionId: promoId,
      promotionName: anchor.getAttribute("data-lf-promo-name") ?? promoId,
      creativeSlot: anchor.getAttribute("data-lf-promo-creative") ?? undefined,
    });
  }

  const slug = productSlugFromPath(anchorPathname(anchor));
  if (slug) {
    const label = (anchor.getAttribute("aria-label") ?? "").replace(/^view\s+/i, "").trim();
    const listId = anchor.getAttribute("data-lf-list") ?? classifyAnalyticsArea(pathname);
    void trackSelectItem({ item_id: slug, item_name: label || slug }, listId);
  }
}
