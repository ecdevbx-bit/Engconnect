"use client";

// Last-resort boundary for errors in the root layout itself (app/error.tsx
// can't catch those). Must render its own <html>/<body>.
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#0b0e14", color: "#ecedf6", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ textAlign: "center", padding: 24 }}>
          <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>Something went wrong.</h1>
          <p style={{ color: "#a9abb3", margin: "0 0 20px" }}>Please try again.</p>
          <button
            type="button"
            onClick={reset}
            style={{ border: 0, borderRadius: 999, padding: "10px 22px", fontWeight: 600, background: "#f59e0b", color: "#0b0e14", cursor: "pointer" }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
