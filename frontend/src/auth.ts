// Server-side session for server components / server actions (DECISIONS D-008).
// Same name and shape as the old NextAuth `auth()` so callers didn't change:
//   const session = await auth(); session?.user.sub / .email / .isAdmin …
// `error` is set when this device's login was superseded by a newer one (D-009).

import "server-only";

import { jwtDecode } from "jwt-decode";

import { supabaseServer } from "@/lib/supabase/server";
import { buildSessionUser, type SessionUser } from "@/server/domain/session";
import { db } from "@/server/supabase";

export type ServerSession = {
  user: SessionUser;
  expires: string;
  error?: "SessionSuperseded";
};

export async function auth(): Promise<ServerSession | null> {
  const supabase = await supabaseServer();
  // getClaims() verifies the JWT (never trust getSession() alone on the server).
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims as { sub?: string; email?: string; session_id?: string; exp?: number } | undefined;
  if (!claims?.sub) return null;

  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token ?? "";
  const sessionId = claims.session_id ?? (accessToken ? jwtDecode<{ session_id?: string }>(accessToken).session_id ?? "" : "");

  const user = await buildSessionUser({
    userId: claims.sub,
    email: claims.email ?? "",
    sessionId,
    accessToken,
    fallbackName: (data.session?.user.user_metadata?.full_name as string | undefined) ?? "",
  });

  const { data: prof } = await db().from("profiles").select("active_session_id").eq("id", claims.sub).maybeSingle();
  const superseded = !!prof?.active_session_id && !!sessionId && prof.active_session_id !== sessionId;

  return {
    user,
    expires: new Date((claims.exp ?? 0) * 1000).toISOString(),
    ...(superseded ? { error: "SessionSuperseded" as const } : {}),
  };
}
