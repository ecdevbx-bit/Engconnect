import { NextResponse } from "next/server";

import { PRO_LINK_COOKIE, PRO_LINK_MAX_AGE_SECONDS } from "@/lib/proInvite";

// POST /pro/start — mark this browser as having started sign-in from the Pro
// page, then let the client kick off Google sign-in.
//
// This exists as a route handler for one reason: only a route handler (or a
// server action) may SET a cookie, and the cookie is the only carrier that
// survives the Google OAuth round trip — Google hands control back to
// /api/auth/callback/google with its own URL, so anything on the query string
// would be gone before the token exchange runs.
//
// It grants nothing by itself. Whether the link is live, in date and under its
// cap — and above all whether the sign-in creates a NEW account — is decided
// server-side in the backend's applyProLink. Calling this by hand buys nothing
// that opening the public /pro page would not.

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(PRO_LINK_COOKIE, "1", {
    httpOnly: true, // the browser never needs to read it; only our server does
    // "lax" is load-bearing: the cookie must still be sent on the top-level
    // cross-site GET that Google redirects back to, or the mark is lost exactly
    // when the exchange needs it. "strict" would break the whole flow.
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PRO_LINK_MAX_AGE_SECONDS,
  });
  return res;
}
