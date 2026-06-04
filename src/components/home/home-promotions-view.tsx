"use client";

import { useEffect, useRef } from "react";
import { trackViewPromotion, type PromotionParams } from "@/lib/analytics-events";

/** Fires GA4 `view_promotion` once for each home-page merchandising slot when it mounts. */
export function HomePromotionsView({ promotions }: { promotions: PromotionParams[] }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    for (const promo of promotions) void trackViewPromotion(promo);
  }, [promotions]);
  return null;
}
