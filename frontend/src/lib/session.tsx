"use client";

// Drop-in replacement for next-auth/react, backed by Supabase Auth
// (DECISIONS D-008). Same surface the app already used:
//   const { data: session, status, update } = useSession();
//   session.user.accessToken / .sub / .email / .name / .nativeLang / …
//   <SessionProvider>, signOut({ callbackUrl, redirect }), signIn("google", { callbackUrl })
// Plus email/password helpers for the new sign-in form.

import type { Session as SupabaseSession } from "@supabase/supabase-js";
import { jwtDecode } from "jwt-decode";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { supabaseBrowser } from "@/lib/supabase/browser";

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
  isPro: boolean;
};

export type Session = { user: SessionUser; expires: string; error?: string };
type Status = "loading" | "authenticated" | "unauthenticated";
type UpdateArg = { user?: Partial<SessionUser> } | undefined;

type Ctx = {
  data: Session | null;
  status: Status;
  update: (patch?: UpdateArg) => Promise<Session | null>;
};

const SessionContext = createContext<Ctx | null>(null);

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

function sessionIdOf(token: string): string {
  try {
    return jwtDecode<{ session_id?: string }>(token).session_id ?? "";
  } catch {
    return "";
  }
}

// Minimal user built from the auth session alone — used until (or if) the
// profile fetch fails, so the app never gets stuck "loading".
function basicUser(s: SupabaseSession): SessionUser {
  const meta = (s.user.user_metadata ?? {}) as { full_name?: string; name?: string; avatar_url?: string };
  return {
    sub: s.user.id,
    email: s.user.email ?? "",
    name: meta.full_name ?? meta.name ?? "",
    image: meta.avatar_url ?? null,
    accessToken: s.access_token,
    sessionId: sessionIdOf(s.access_token),
    currentStatus: "",
    nativeLang: "",
    avatar: "",
    onboardingCompleted: false,
    isAdmin: false,
    isPro: false,
  };
}

async function fetchSessionUser(token: string): Promise<{ user?: SessionUser; code?: string }> {
  try {
    const res = await fetch(`${API_URL}/api/session`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    const body = (await res.json()) as { success?: boolean; data?: { user: SessionUser }; errorCode?: string };
    if (res.ok && body.success && body.data) return { user: body.data.user };
    return { code: body.errorCode ?? `HTTP_${res.status}` };
  } catch {
    return { code: "NETWORK" };
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const supabase = supabaseBrowser();
  // undefined = still reading the stored session
  const [authSession, setAuthSession] = useState<SupabaseSession | null | undefined>(undefined);
  // Profile + local overlay are keyed by account id, so a sign-out/sign-in
  // never shows the previous account's data (no resets needed).
  const [profileUser, setProfileUser] = useState<SessionUser | null>(null);
  const [overlay, setOverlay] = useState<{ uid: string; patch: Partial<SessionUser> } | null>(null);
  const [profileFor, setProfileFor] = useState<string | null>(null);
  const tokenRef = useRef<string>("");

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive) setAuthSession(data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setAuthSession(s));
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    tokenRef.current = authSession?.access_token ?? "";
  }, [authSession]);
  const uid = authSession?.user?.id ?? null;

  const loadProfile = useCallback(async () => {
    const token = tokenRef.current;
    if (!token) return null;
    const { user, code } = await fetchSessionUser(token);
    if (code === "SESSION_SUPERSEDED") {
      await supabase.auth.signOut({ scope: "local" });
      window.location.assign("/login?reason=signed_in_elsewhere");
      return null;
    }
    if (user) setProfileUser(user);
    return user ?? null;
  }, [supabase]);

  // (Re)load the profile whenever the signed-in account changes.
  useEffect(() => {
    if (!uid) return;
    let alive = true;
    void loadProfile().finally(() => {
      if (alive) setProfileFor(uid);
    });
    return () => {
      alive = false;
    };
  }, [uid, loadProfile]);

  const data = useMemo<Session | null>(() => {
    if (!authSession) return null;
    const base = profileUser && profileUser.sub === authSession.user.id ? profileUser : basicUser(authSession);
    return {
      user: {
        ...base,
        ...(overlay && overlay.uid === authSession.user.id ? overlay.patch : {}),
        // always the live, auto-refreshed token
        accessToken: authSession.access_token,
        sessionId: sessionIdOf(authSession.access_token),
      },
      expires: new Date((authSession.expires_at ?? 0) * 1000).toISOString(),
    };
  }, [authSession, profileUser, overlay]);

  const status: Status =
    authSession === undefined ? "loading" : authSession === null ? "unauthenticated" : profileFor === uid ? "authenticated" : "loading";

  const update = useCallback(
    async (patch?: UpdateArg) => {
      await loadProfile();
      const id = uid;
      const extra = patch?.user;
      if (id && extra) {
        setOverlay((o) => ({ uid: id, patch: { ...(o && o.uid === id ? o.patch : {}), ...extra } }));
      }
      return data;
    },
    [loadProfile, data, uid],
  );

  const value = useMemo<Ctx>(() => ({ data, status, update }), [data, status, update]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Ctx {
  const ctx = useContext(SessionContext);
  if (!ctx) return { data: null, status: "loading", update: async () => null };
  return ctx;
}

// ── actions ─────────────────────────────────────────────────────────

export async function signOut(opts: { callbackUrl?: string; redirect?: boolean } = {}): Promise<void> {
  // "local": only this device — never sign the learner out everywhere.
  await supabaseBrowser().auth.signOut({ scope: "local" });
  if (opts.redirect !== false) window.location.assign(opts.callbackUrl ?? "/");
}

export async function signInWithGoogle(next = "/dashboard"): Promise<void> {
  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
  const { error } = await supabaseBrowser().auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, queryParams: { prompt: "select_account" } },
  });
  if (error) throw error;
}

// next-auth compatibility: signIn("google", { callbackUrl })
export async function signIn(provider: "google", opts: { callbackUrl?: string } = {}): Promise<void> {
  if (provider === "google") return signInWithGoogle(opts.callbackUrl ?? "/dashboard");
}

export type PasswordSignInResult = { ok: true } | { ok: false; code: "INVALID" | "UNCONFIRMED" | "RATE_LIMITED" | "OTHER"; message: string };

export async function signInWithPassword(email: string, password: string): Promise<PasswordSignInResult> {
  const supabase = supabaseBrowser();
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error || !data.session) {
    const msg = error?.message ?? "Sign-in failed.";
    if (/not confirmed/i.test(msg)) return { ok: false, code: "UNCONFIRMED", message: "Please confirm your email first — check your inbox." };
    if (/invalid login|invalid credentials/i.test(msg)) return { ok: false, code: "INVALID", message: "Wrong email or password." };
    if (/rate limit|too many/i.test(msg)) return { ok: false, code: "RATE_LIMITED", message: "Too many attempts. Please wait a minute and try again." };
    return { ok: false, code: "OTHER", message: msg };
  }
  // Make this login the account's only valid one (D-009).
  await fetch(`${API_URL}/api/session/start`, {
    method: "POST",
    headers: { Authorization: `Bearer ${data.session.access_token}` },
  }).catch(() => {});
  return { ok: true };
}

// Email endpoints (rate-limited server-side). Resolve to the server's message.
export async function accountRequest(
  path: "signup" | "resend" | "reset",
  body: Record<string, string>,
): Promise<{ ok: boolean; message: string; code?: string }> {
  try {
    const res = await fetch(`${API_URL}/api/account/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as { success?: boolean; message?: string; errorCode?: string };
    return { ok: res.ok && !!json.success, message: json.message ?? "", code: json.errorCode };
  } catch {
    return { ok: false, message: "Network error — please try again.", code: "NETWORK" };
  }
}
