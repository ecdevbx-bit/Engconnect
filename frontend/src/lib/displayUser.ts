// DisplayUser is the small shape the navbar / account dropdown actually
// need. The Firebase User type is structurally compatible (it has all
// these fields with the same names), so callers can hand a Firebase User
// straight in. The NextAuth session-user can be mapped via
// fromSessionUser() below.

export type DisplayUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  photoURL: string | null;
  // Admin flag is meaningful only for v3 (NextAuth) users — the session
  // callback in src/auth.ts populates it from ADMIN_EMAILS. v1 (Firebase)
  // users always see `undefined` (treated as false). The admin page
  // server-component is the hard auth gate anyway, so this is purely for
  // UI affordances. Optional so a Firebase User (which has every other
  // DisplayUser field) is still assignable here.
  isAdmin?: boolean;
};

type SessionUserShape = {
  sub?: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  avatar?: string | null;
  isAdmin?: boolean;
} | undefined;

/**
 * Map a NextAuth session.user onto the DisplayUser shape. Returns null
 * when there's no `sub` (i.e. no Cognito session).
 *
 * `emailVerified` is hard-coded true because Cognito will not issue tokens
 * for an unverified user — if there's a session, they're verified.
 */
export function fromSessionUser(u: SessionUserShape): DisplayUser | null {
  if (!u?.sub) return null;
  // Prefer a DiceBear avatar URL if the user has one set; fall back to
  // the OAuth `image` (currently unused — Cognito doesn't carry one)
  // and finally to null, which the renderer shows as initials.
  //
  // URL construction goes through the same env-driven base as
  // lib/v3Game.ts's avatarUrl(), but inlined here to avoid pulling in
  // that whole module on every server-render of fromSessionUser().
  const base = (process.env.NEXT_PUBLIC_DICEBEAR_BASE_URL ?? "https://api.dicebear.com").replace(/\/$/, "");
  const dicebear = u.avatar
    ? `${base}/9.x/${u.avatar.split(":")[0]}/svg?seed=${encodeURIComponent(u.avatar.split(":").slice(1).join(":"))}&size=80`
    : null;
  return {
    uid: u.sub,
    email: u.email ?? null,
    displayName: u.name ?? null,
    emailVerified: true,
    photoURL: dicebear ?? u.image ?? null,
    isAdmin: u.isAdmin === true,
  };
}
