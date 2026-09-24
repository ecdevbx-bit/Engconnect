// Browser error monitoring (Sentry, D-044). Errors only — no tracing, no
// session replay — so it adds as little as possible to every page. Enabled only
// on Vercel deployments (NEXT_PUBLIC_APP_ENV is baked in by next.config.ts).
import * as Sentry from "@sentry/nextjs";

import { DATA_COLLECTION, IGNORE_ERRORS, scrubBreadcrumb, scrubEvent } from "@/lib/sentryScrub";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const env = process.env.NEXT_PUBLIC_APP_ENV ?? "local";

Sentry.init({
  dsn,
  enabled: !!dsn && env !== "local",
  environment: env,
  dataCollection: DATA_COLLECTION,
  tracesSampleRate: 0,
  ignoreErrors: IGNORE_ERRORS,
  denyUrls: [/extensions\//i, /^chrome(-extension)?:\/\//i, /^moz-extension:\/\//i, /^safari-web-extension:\/\//i],
  beforeSend: scrubEvent,
  beforeBreadcrumb: scrubBreadcrumb,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
