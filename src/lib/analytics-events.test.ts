import { describe, expect, it, vi, beforeEach } from "vitest";
import { handleInternalLinkClick, handleOutboundLinkClick } from "@/lib/analytics-events";

const logAnalyticsEvent = vi.fn();

vi.mock("@/lib/firebase-analytics", () => ({
  logAnalyticsEvent: (...args: unknown[]) => logAnalyticsEvent(...args),
}));

function mockAnchor(href: string, attrs: Record<string, string> = {}): HTMLAnchorElement {
  return {
    href,
    getAttribute: (name: string) => attrs[name] ?? null,
  } as HTMLAnchorElement;
}

describe("handleOutboundLinkClick", () => {
  beforeEach(() => {
    logAnalyticsEvent.mockClear();
  });

  it("tracks WhatsApp clicks with inferred location", () => {
    handleOutboundLinkClick("/contact", mockAnchor("https://wa.me/2349067803879?text=hi"));
    expect(logAnalyticsEvent).toHaveBeenCalledWith(
      "whatsapp_click",
      expect.objectContaining({ link_location: "contact" }),
    );
  });

  it("tracks mailto clicks", () => {
    handleOutboundLinkClick("/contact", mockAnchor("mailto:test@example.com?subject=Hello"));
    expect(logAnalyticsEvent).toHaveBeenCalledWith(
      "mailto_click",
      expect.objectContaining({ link_location: "contact", subject: "Hello" }),
    );
  });

  it("uses data-lf-analytics when set", () => {
    handleOutboundLinkClick(
      "/",
      mockAnchor("https://wa.me/2349067803879", { "data-lf-analytics": "footer" }),
    );
    expect(logAnalyticsEvent).toHaveBeenCalledWith(
      "whatsapp_click",
      expect.objectContaining({ link_location: "footer" }),
    );
  });
});

describe("handleInternalLinkClick", () => {
  beforeEach(() => {
    logAnalyticsEvent.mockClear();
  });

  it("fires select_item for a product link and infers the list from the route", () => {
    handleInternalLinkClick(
      "/shop",
      mockAnchor("/shop/emerald-gown", { href: "/shop/emerald-gown", "aria-label": "View Emerald gown" }),
    );
    expect(logAnalyticsEvent).toHaveBeenCalledWith(
      "select_item",
      expect.objectContaining({
        item_list_id: "shop",
        items: [expect.objectContaining({ item_id: "emerald-gown", item_name: "Emerald gown" })],
      }),
    );
  });

  it("uses data-lf-list override for the list id", () => {
    handleInternalLinkClick(
      "/",
      mockAnchor("/shop/abaya", { href: "/shop/abaya", "data-lf-list": "best_sellers" }),
    );
    expect(logAnalyticsEvent).toHaveBeenCalledWith(
      "select_item",
      expect.objectContaining({ item_list_id: "best_sellers" }),
    );
  });

  it("does not fire select_item for non-product links", () => {
    handleInternalLinkClick("/", mockAnchor("/custom", { href: "/custom" }));
    expect(logAnalyticsEvent).not.toHaveBeenCalledWith("select_item", expect.anything());
  });

  it("fires select_promotion for tagged promo links", () => {
    handleInternalLinkClick(
      "/",
      mockAnchor("/shop", {
        href: "/shop",
        "data-lf-promo-id": "home_hero",
        "data-lf-promo-name": "Home hero",
        "data-lf-promo-creative": "home_hero",
      }),
    );
    expect(logAnalyticsEvent).toHaveBeenCalledWith(
      "select_promotion",
      expect.objectContaining({
        promotion_id: "home_hero",
        promotion_name: "Home hero",
        creative_slot: "home_hero",
      }),
    );
  });
});
