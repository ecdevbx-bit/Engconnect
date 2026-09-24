// Shared Sentry privacy filter (browser, server and edge). Learners' tokens and
// audio must never reach Sentry: auth links carry tokens in the URL (#access_token,
// ?token_hash, ?code), and API requests carry a Bearer token.
import type { Breadcrumb, ErrorEvent, init } from "@sentry/nextjs";

// What the SDK may collect at all (Sentry v11 `dataCollection`): no cookies,
// no bodies (recordings, transcripts), no auth headers, no local variables.
export const DATA_COLLECTION: NonNullable<Parameters<typeof init>[0]>["dataCollection"] = {
  userInfo: false,
  cookies: false,
  httpHeaders: { request: { deny: ["authorization", "cookie", "x-internal-key", "x-session-id"] }, response: false },
  httpBodies: [],
  urlQueryParams: { deny: ["access_token", "refresh_token", "token_hash", "token", "code"] },
  genAI: { inputs: false, outputs: false },
  databaseQueryData: false,
  stackFrameVariables: false,
};

const SECRET_PARAMS = /([?&#](?:access_token|refresh_token|token_hash|token|code|provider_token)=)[^&#\s]+/gi;

export function scrubUrl(url: string | undefined): string | undefined {
  return url?.replace(SECRET_PARAMS, "$1[redacted]");
}

export function scrubEvent(event: ErrorEvent): ErrorEvent {
  if (event.request) {
    event.request.url = scrubUrl(event.request.url);
    event.request.query_string = undefined;
    event.request.cookies = undefined;
    event.request.data = undefined;
    if (event.request.headers) {
      for (const h of Object.keys(event.request.headers)) {
        if (/^(authorization|cookie|x-internal-key|x-api-key)$/i.test(h)) delete event.request.headers[h];
      }
    }
  }
  // Only an opaque id identifies the learner (set in lib/session.tsx).
  if (event.user) event.user = event.user.id ? { id: event.user.id } : undefined;
  return event;
}

export function scrubBreadcrumb(b: Breadcrumb): Breadcrumb {
  if (b.data) {
    for (const k of ["url", "from", "to"]) {
      if (typeof b.data[k] === "string") b.data[k] = scrubUrl(b.data[k] as string);
    }
  }
  if (typeof b.message === "string") b.message = scrubUrl(b.message);
  return b;
}

// Browser noise that isn't a bug in our code.
export const IGNORE_ERRORS: (string | RegExp)[] = [
  "ResizeObserver loop limit exceeded",
  "ResizeObserver loop completed with undelivered notifications",
  /NotAllowedError/, // microphone permission denied — a learner choice
  /AbortError/,
  /Failed to fetch|Load failed|NetworkError when attempting to fetch resource/, // flaky mobile network
  "Non-Error promise rejection captured",
];
