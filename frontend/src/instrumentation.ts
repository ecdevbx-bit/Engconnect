// Server + edge error monitoring (Sentry, D-044). Enabled only on Vercel
// (VERCEL_ENV is set there), so local dev and local `next start` stay quiet.
import * as Sentry from "@sentry/nextjs";

import { DATA_COLLECTION, scrubBreadcrumb, scrubEvent } from "@/lib/sentryScrub";

export async function register() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  const env = process.env.VERCEL_ENV;
  Sentry.init({
    dsn,
    enabled: !!dsn && !!env,
    environment: env ?? "local",
    dataCollection: DATA_COLLECTION,
    // A few server traces show where slow requests (Gemini calls) spend time.
    tracesSampleRate: process.env.NEXT_RUNTIME === "nodejs" ? 0.05 : 0,
    beforeSend: scrubEvent,
    beforeBreadcrumb: scrubBreadcrumb,
  });
}

// Errors thrown while rendering server components / route handlers.
export const onRequestError = Sentry.captureRequestError;
