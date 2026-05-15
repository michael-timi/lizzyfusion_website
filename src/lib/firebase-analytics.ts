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

export type AnalyticsEventParamValue =
  | string
  | number
  | boolean
  | AnalyticsEventParamValue[]
  | { [key: string]: AnalyticsEventParamValue };

/**
 * Log a GA4 / Firebase Analytics event. No-ops when Analytics is unavailable
 * (SSR, missing config, unsupported browser, or SDK error).
 */
export async function logAnalyticsEvent(
  eventName: string,
  eventParams?: Record<string, AnalyticsEventParamValue>,
): Promise<void> {
  const analytics = await loadAnalytics();
  if (!analytics) return;
  const { logEvent } = await import("firebase/analytics");
  // Firebase `logEvent` accepts GA4 ecommerce item arrays; our wrapper stays permissive.
  logEvent(analytics, eventName, eventParams as Record<string, unknown> | undefined);
}

/** Associate signed-in Firebase Auth uid with Analytics (cleared on logout). */
export async function setAnalyticsUserId(userId: string | null): Promise<void> {
  const analytics = await loadAnalytics();
  if (!analytics) return;
  const { setUserId } = await import("firebase/analytics");
  setUserId(analytics, userId);
}
