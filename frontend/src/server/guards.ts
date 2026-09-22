import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "node:crypto";

import { env } from "./env";
import { fail } from "./http";
import { db } from "./supabase";

export type AuthedUser = {
  id: string;
  email: string;
  isAdmin: boolean;
  // Supabase auth session id (JWT `session_id` claim) — one per login.
  sessionId: string;
};

// One long-lived verifier so the JWKS (asymmetric signing keys) is cached
// across requests and verification is local — no Auth round-trip per call.
let verifier: SupabaseClient | null = null;
function jwtVerifier(): SupabaseClient {
  if (!verifier) {
    verifier = createClient(env.supabaseUrl(), env.supabasePublishableKey(), {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return verifier;
}

function bearer(req: Request): string {
  const h = req.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m ? m[1].trim() : "";
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return env.adminEmails().includes(email.trim().toLowerCase());
}

// Verify a Supabase access token (signature + expiry). No supersede check.
export async function verifyAccessToken(token: string): Promise<AuthedUser> {
  if (!token) throw fail.unauthorized();
  const { data, error } = await jwtVerifier().auth.getClaims(token);
  if (error || !data?.claims?.sub) throw fail.unauthorized();
  const claims = data.claims as { sub: string; email?: string; role?: string; session_id?: string };
  if (claims.role && claims.role !== "authenticated") throw fail.unauthorized();
  const email = claims.email ?? "";
  return { id: claims.sub, email, isAdmin: isAdminEmail(email), sessionId: claims.session_id ?? "" };
}

export function verifyToken(req: Request): Promise<AuthedUser> {
  return verifyAccessToken(bearer(req));
}

// Short cache of each account's current login, so the supersede check costs
// at most one small query per user every few seconds.
const activeCache = new Map<string, { sid: string | null; at: number }>();
const ACTIVE_TTL_MS = 5_000;

export function rememberActiveSession(userId: string, sid: string | null) {
  activeCache.set(userId, { sid, at: Date.now() });
}

async function activeSessionOf(userId: string): Promise<string | null> {
  const hit = activeCache.get(userId);
  if (hit && Date.now() - hit.at < ACTIVE_TTL_MS) return hit.sid;
  const { data } = await db().from("profiles").select("active_session_id").eq("id", userId).maybeSingle();
  const sid = (data?.active_session_id as string | null) ?? null;
  rememberActiveSession(userId, sid);
  return sid;
}

// requireUser = valid token AND it belongs to the account's latest login
// (DECISIONS D-009). An older device gets SESSION_SUPERSEDED and signs out.
export async function requireUser(req: Request): Promise<AuthedUser> {
  const u = await verifyToken(req);
  if (u.sessionId) {
    const active = await activeSessionOf(u.id);
    if (active && active !== u.sessionId) {
      throw fail.forbidden(
        "You've been signed out because your account was opened on another device.",
        "SESSION_SUPERSEDED",
      );
    }
  }
  return u;
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

// requireInternal gates the admin + server-to-server endpoints. Accepts either
// the shared INTERNAL_API_KEY (Next server actions) or a signed-in admin's
// Bearer token (ADMIN_EMAILS allow-list).
export async function requireInternal(req: Request): Promise<{ by: string }> {
  const key = env.internalApiKey();
  const given = req.headers.get("x-internal-api-key") ?? "";
  if (key && given && safeEqual(given, key)) return { by: "internal-key" };

  if (bearer(req)) {
    const u = await requireUser(req);
    if (u.isAdmin) return { by: u.email };
  }
  throw fail.forbidden("Admin access required.");
}
