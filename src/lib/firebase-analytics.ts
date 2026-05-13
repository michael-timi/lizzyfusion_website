import { getFirebaseApp } from "@/lib/firebase";
import type { Analytics } from "firebase/analytics";

let analyticsLoadPromise: Promise<Analytics | null> | null = null;

function loadAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (!analyticsLoadPromise) {
    analyticsLoadPromise = (async () => {
      const app = getFirebaseApp();
      if (!app) return null;
      const { getAnalytics, isSupported } = await import("firebase/analytics");
      if (!(await isSupported())) return null;
      try {
        return getAnalytics(app);
      } catch {
        return null;
      }
    })();
  }
  return analyticsLoadPromise;
}

/** Start loading the Analytics module (safe to call once on mount). */
export function warmupFirebaseAnalytics(): void {
  void loadAnalytics();
}

/**
 * Log a GA4 / Firebase Analytics event. No-ops when Analytics is unavailable
 * (SSR, missing config, unsupported browser, or SDK error).
 */
export async function logAnalyticsEvent(
  eventName: string,
  eventParams?: Record<string, string | number | boolean>,
): Promise<void> {
  const analytics = await loadAnalytics();
  if (!analytics) return;
  const { logEvent } = await import("firebase/analytics");
  logEvent(analytics, eventName, eventParams);
}
