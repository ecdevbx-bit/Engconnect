// v3 auth helpers. Auth is Supabase (DECISIONS D-008): Google via
// signInWithOAuth (→ /auth/callback), email+password via lib/session.tsx.

import { signInWithGoogle } from "@/lib/session";

/**
 * V3AuthError carries a stable code so callers can branch on it without
 * parsing message strings.
 */
export class V3AuthError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "V3AuthError";
    this.code = code;
  }
}

/**
 * Kick off Google sign-in. Redirects to Google's consent screen and, on
 * success, back through /auth/callback (which sets the Supabase session
 * cookie and records the login) to `callbackUrl`.
 */
export async function googleSignIn(callbackUrl = "/dashboard"): Promise<void> {
  await signInWithGoogle(callbackUrl);
}

/**
 * Map a V3AuthError code to a user-facing message.
 */
export function v3FriendlyError(err: unknown): string {
  if (!(err instanceof V3AuthError)) {
    return err instanceof Error ? err.message : "An unexpected error occurred.";
  }
  switch (err.code) {
    case "GoogleExchangeError":
    case "GoogleNoIdToken":
      return "We couldn't complete Google sign-in. Please try again.";
    case "EMAIL_NOT_VERIFIED":
      return "Your Google email isn't verified. Please verify it with Google and try again.";
    default:
      return err.message || "Authentication failed.";
  }
}
