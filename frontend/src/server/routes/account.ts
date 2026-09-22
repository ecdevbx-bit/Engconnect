import "server-only";

import { createHash } from "node:crypto";

import { buildSessionUser, maybeGrantProLink, recordLogin } from "../domain/session";
import { requireUser, verifyToken } from "../guards";
import { ApiFailure, fail, ok, readJson, str } from "../http";
import type { Router } from "../router";
import { authClient, db } from "../supabase";

// Auth helpers around Supabase Auth (DECISIONS D-008 / D-009 / D-020).
//
//   GET  /session           → the UI's session payload (profile + isAdmin)
//   POST /session/start     → "this is a new login": make it the only valid one
//   POST /account/signup    → email+password sign-up (sends confirmation email)
//   POST /account/resend    → resend the confirmation email
//   POST /account/reset     → send a password-reset email
//
// Email-sending endpoints are rate-limited per address and per IP, and always
// answer the same way whether or not the account exists (no enumeration).

const LIMITS = {
  signup: { perEmail: 3, perIp: 10 },
  resend: { perEmail: 3, perIp: 10 },
  reset: { perEmail: 3, perIp: 10 },
} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function clientIpHash(req: Request): string {
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "";
  return ip ? createHash("sha256").update(ip).digest("hex").slice(0, 24) : "";
}

// Where email links should land: this deployment's origin.
function siteOrigin(req: Request): string {
  const origin = req.headers.get("origin");
  if (origin && /^https?:\/\//.test(origin)) return origin.replace(/\/$/, "");
  const url = new URL(req.url);
  const host = req.headers.get("x-forwarded-host") ?? url.host;
  const proto = req.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  return `${proto}://${host}`;
}

async function allowEmail(kind: keyof typeof LIMITS, email: string, req: Request): Promise<void> {
  const { data, error } = await db().rpc("auth_email_allow", {
    p_kind: kind,
    p_email: email,
    p_ip_hash: clientIpHash(req),
    p_per_email: LIMITS[kind].perEmail,
    p_per_ip: LIMITS[kind].perIp,
    p_window_minutes: 60,
  });
  if (error) throw new Error(`email limit check: ${error.message}`);
  if (data !== true) {
    throw new ApiFailure(429, "EMAIL_RATE_LIMITED", "Too many emails requested. Please wait a while and try again.");
  }
}

function emailFrom(body: Record<string, unknown>): string {
  const email = str(body.email, "email", { required: true, max: 254 }).toLowerCase();
  if (!EMAIL_RE.test(email)) throw fail.badRequest("Please enter a valid email address.", { email: "invalid" });
  return email;
}

export function validatePassword(pw: string): string | null {
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (pw.length > 72) return "Password must be at most 72 characters.";
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return "Use at least one letter and one number.";
  return null;
}

// Supabase auth errors that mean "the email couldn't be sent right now".
function mailerError(message: string): ApiFailure {
  if (/rate limit|too many|security purposes/i.test(message)) {
    return new ApiFailure(429, "EMAIL_RATE_LIMITED", "Too many emails requested. Please wait a while and try again.");
  }
  return fail.unavailable("We couldn't send the email right now. Please try again shortly.", "EMAIL_SEND_FAILED");
}

export function registerAccountRoutes(r: Router) {
  r.on("GET", "/session", async ({ req }) => {
    const u = await requireUser(req);
    const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
    return ok({ user: await buildSessionUser({ userId: u.id, email: u.email, sessionId: u.sessionId, accessToken: token }) });
  });

  // Called by the browser right after a password sign-in (OAuth and email
  // links record the login server-side in /auth/callback and /auth/confirm).
  r.on("POST", "/session/start", async ({ req }) => {
    const u = await verifyToken(req);
    await recordLogin(u.id, u.sessionId);
    // Email-link sign-ins that started on /pro carry the Pro-link cookie here.
    const viaPro = /(?:^|;\s*)ec_pro_link=1(?:;|$)/.test(req.headers.get("cookie") ?? "");
    if (viaPro) await maybeGrantProLink(u.id, "", true);
    const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
    const res = ok({ user: await buildSessionUser({ userId: u.id, email: u.email, sessionId: u.sessionId, accessToken: token }) });
    if (viaPro) res.headers.append("Set-Cookie", "ec_pro_link=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax");
    return res;
  });

  r.on("POST", "/account/signup", async ({ req }) => {
    const body = await readJson(req);
    const email = emailFrom(body);
    const password = typeof body.password === "string" ? body.password : "";
    const pwError = validatePassword(password);
    if (pwError) throw fail.badRequest(pwError, { password: "weak" });
    const name = str(body.name, "name", { max: 60 });
    await allowEmail("signup", email, req);

    const { error } = await authClient().auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${siteOrigin(req)}/auth/confirm`, data: name ? { full_name: name } : undefined },
    });
    if (error) {
      if (/already registered|already exists/i.test(error.message)) {
        // Same answer as success — don't reveal which emails have accounts.
        return ok({ sent: true }, "If this email can be used, we've sent a confirmation link.");
      }
      if (/password/i.test(error.message)) throw fail.badRequest(error.message, { password: "weak" });
      throw mailerError(error.message);
    }
    return ok({ sent: true }, "Check your inbox for a confirmation link.");
  });

  r.on("POST", "/account/resend", async ({ req }) => {
    const email = emailFrom(await readJson(req));
    await allowEmail("resend", email, req);
    const { error } = await authClient().auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${siteOrigin(req)}/auth/confirm` },
    });
    if (error && !/not found|already confirmed/i.test(error.message)) throw mailerError(error.message);
    return ok({ sent: true }, "If this email is waiting for confirmation, we've sent a new link.");
  });

  r.on("POST", "/account/reset", async ({ req }) => {
    const email = emailFrom(await readJson(req));
    await allowEmail("reset", email, req);
    const { error } = await authClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${siteOrigin(req)}/auth/confirm`,
    });
    if (error && !/not found/i.test(error.message)) throw mailerError(error.message);
    return ok({ sent: true }, "If an account exists for this email, a reset link is on its way.");
  });
}
