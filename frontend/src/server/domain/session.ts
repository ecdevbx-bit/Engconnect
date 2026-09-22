import "server-only";

import { isAdminEmail, rememberActiveSession } from "../guards";
import { db } from "../supabase";
import { grantProInviteIfEligible } from "./premium";
import type { ProfileRow } from "./users";

// The session payload the UI reads (same fields the old NextAuth session had,
// so components didn't change). Built from the Supabase auth user + profile.
export type SessionUser = {
  sub: string;
  email: string;
  name: string;
  image: string | null;
  accessToken: string;
  sessionId: string;
  currentStatus: string;
  nativeLang: string;
  avatar: string;
  onboardingCompleted: boolean;
  isAdmin: boolean;
  // Pro right now (premium_until in the future) — drives the navbar PRO badge.
  isPro: boolean;
};

export async function buildSessionUser(args: {
  userId: string;
  email: string;
  sessionId: string;
  accessToken: string;
  fallbackName?: string;
  image?: string | null;
}): Promise<SessionUser> {
  const { data } = await db().from("profiles").select("*").eq("id", args.userId).maybeSingle();
  const p = data as ProfileRow | null;
  const email = p?.email || args.email;
  return {
    sub: args.userId,
    email,
    name: p?.name || args.fallbackName || "",
    image: args.image ?? null,
    accessToken: args.accessToken,
    sessionId: args.sessionId,
    currentStatus: p?.current_status ?? "",
    nativeLang: p?.native_lang ?? "",
    avatar: p?.avatar ?? "",
    onboardingCompleted: p?.onboarding_completed ?? false,
    isAdmin: isAdminEmail(email),
    isPro: !!p?.premium_until && new Date(p.premium_until).getTime() > Date.now(),
  };
}

// A new login happened: make it the account's only valid session (D-009).
export async function recordLogin(userId: string, sessionId: string): Promise<void> {
  if (!sessionId) return;
  await db().from("profiles").update({ active_session_id: sessionId }).eq("id", userId);
  rememberActiveSession(userId, sessionId);
}

// Called after an OAuth/email sign-in: if the visit started on /pro, grant Pro
// (once per account, new or existing — D-021).
export async function maybeGrantProLink(userId: string, _userCreatedAt: string, viaProLink: boolean) {
  if (!viaProLink) return;
  try {
    await grantProInviteIfEligible(userId);
  } catch (err) {
    console.error("[auth] pro link grant failed:", err);
  }
}
