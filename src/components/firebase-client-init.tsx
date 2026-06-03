"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  handleInternalLinkClick,
  handleOutboundLinkClick,
  trackCheckoutFunnelView,
  trackPageView,
} from "@/lib/analytics-events";
import { warmupFirebaseAnalytics } from "@/lib/firebase-analytics";

/** Loads Analytics once, logs page views, checkout funnel steps, and outbound WhatsApp/mailto clicks. */
export function FirebaseClientInit() {
  const pathname = usePathname() ?? "/";
  const lastFunnelStep = useRef<string | null>(null);

  useEffect(() => {
    warmupFirebaseAnalytics();
  }, []);

  useEffect(() => {
    const page_title = typeof document !== "undefined" ? document.title : "";
    void trackPageView(pathname, page_title);
  }, [pathname]);

  useEffect(() => {
    const stepKey = pathname;
    if (lastFunnelStep.current === stepKey) return;
    lastFunnelStep.current = stepKey;
    void trackCheckoutFunnelView(pathname);
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a");
      if (!anchor || !(anchor instanceof HTMLAnchorElement)) return;
      handleOutboundLinkClick(pathname, anchor);
      handleInternalLinkClick(pathname, anchor);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname]);

  return null;
}
