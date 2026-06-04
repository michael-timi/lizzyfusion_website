"use client";

import { useEffect } from "react";
import { trackException } from "@/lib/analytics-events";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    const detail = error.digest ? `${error.message} (digest ${error.digest})` : error.message;
    void trackException(`global: ${detail || error.name}`, true);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.25rem",
          padding: "2rem",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
          color: "#1a1a1a",
          background: "#fff",
        }}
      >
        <h1 style={{ fontSize: "1.75rem", fontWeight: 600, margin: 0 }}>Something went wrong</h1>
        <p style={{ maxWidth: "28rem", margin: 0, color: "#666", lineHeight: 1.6 }}>
          The page failed to load. Please try again, or reload your browser.
        </p>
        <button
          type="button"
          onClick={() => unstable_retry()}
          style={{
            borderRadius: "9999px",
            border: "none",
            background: "#5b3b8c",
            color: "#fff",
            padding: "0.75rem 1.5rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
