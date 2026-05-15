"use client";

import { useEffect } from "react";
import { installClientNetworkLogger, installGlobalErrorLoggers } from "@/lib/client-network-logger";

/** Mount once under `Providers` — no UI. */
export function ClientNetworkLogger() {
  useEffect(() => {
    installClientNetworkLogger();
    installGlobalErrorLoggers();
  }, []);
  return null;
}
