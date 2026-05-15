import { describe, expect, it, vi, beforeEach } from "vitest";
import { handleOutboundLinkClick } from "@/lib/analytics-events";

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
