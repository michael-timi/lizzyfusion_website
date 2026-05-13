"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { logAnalyticsEvent, warmupFirebaseAnalytics } from "@/lib/firebase-analytics";

/** Loads Analytics once and logs `page_view` on App Router navigations. */
export function FirebaseClientInit() {
  const pathname = usePathname();

  useEffect(() => {
    warmupFirebaseAnalytics();
  }, []);

  useEffect(() => {
    if (!pathname) return;
    const page_title = typeof document !== "undefined" ? document.title : "";
    void logAnalyticsEvent("page_view", { page_path: pathname, page_title });
  }, [pathname]);

  return null;
}
