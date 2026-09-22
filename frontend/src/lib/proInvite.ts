// Shared bits of the Pro-link flow (server-side only in practice).
//
// The link is one FIXED public URL: /pro. It is a separate entry point from
// /login and /signup — its own landing page, its own cookie, its own promise.
// Opening the page and starting sign-in from there marks the visit; the auth.ts
// jwt callback reads that mark and tells the backend the signup came from the
// Pro page, which grants Pro if — and only if — the exchange creates a new
// account. See englishconnection-api/internal/apiv3/proinvite.go.
//
// Why a cookie and not a query param: the Google OAuth round trip owns the URL
// (it hands control back to /api/auth/callback/google with its own params), so
// anything hung on the query string is gone by the time the token exchange runs.

// PRO_LINK_PATH must match ProLinkPath in the backend (proinvite.go).
export const PRO_LINK_PATH = "/pro";

export const PRO_LINK_COOKIE = "ec_pro_link";

// One hour is comfortably longer than a Google sign-in takes and short enough
// that a mark left on a shared browser goes stale quickly. It only ever matters
// for an account created inside that window — see the backend gates.
export const PRO_LINK_MAX_AGE_SECONDS = 60 * 60;

export type ProLinkStatus = {
  active: boolean;
  endsOn: string;
  durationDays?: number;
};

// Format the backend's inclusive IST cutoff ("YYYY-MM-DD") for display.
export function formatProLinkEndsOn(endsOn: string): string {
  if (!endsOn) return "";
  const d = new Date(`${endsOn}T00:00:00+05:30`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
}
