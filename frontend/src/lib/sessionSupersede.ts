import { signOut } from "@/lib/session";

// Called when the backend reports the account is active elsewhere — either an
// HTTP response with errorCode "SESSION_SUPERSEDED", or the chat socket closing
// with the supersede code. We sign this device out and bounce to /login with a
// reason the page can surface. Guarded so a burst of in-flight 401s (every
// pending request fails at once) triggers exactly one sign-out.
let signingOut = false;

export const SESSION_SUPERSEDED_CODE = "SESSION_SUPERSEDED";

export function handleSessionSuperseded(): void {
  if (typeof window === "undefined" || signingOut) return;
  signingOut = true;
  void signOut({ callbackUrl: "/login?reason=signed_in_elsewhere" });
}
