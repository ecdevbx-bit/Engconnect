import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { PRO_LINK_COOKIE } from "@/lib/proInvite";
import { supabaseServer } from "@/lib/supabase/server";
import { maybeGrantProLink, recordLogin } from "@/server/domain/session";

// OAuth return point (Google → Supabase → here with ?code=…). Exchanges the
// code for a cookie session, makes this login the account's only valid one
// (D-009), applies the /pro link (D-010), then continues to `next`.
export const dynamic = "force-dynamic";

function safeNext(v: string | null): string {
  return v && v.startsWith("/") && !v.startsWith("//") ? v : "/dashboard";
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));
  if (!code) return NextResponse.redirect(new URL("/login?error=oauth", url.origin));

  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.session || !data.user) {
    console.error("[auth/callback] code exchange failed:", error?.message);
    return NextResponse.redirect(new URL("/login?error=oauth", url.origin));
  }

  const sid = jwtDecode<{ session_id?: string }>(data.session.access_token).session_id ?? "";
  await recordLogin(data.user.id, sid);

  const jar = await cookies();
  const viaProLink = jar.get(PRO_LINK_COOKIE)?.value === "1";
  if (viaProLink) jar.delete(PRO_LINK_COOKIE);
  await maybeGrantProLink(data.user.id, data.user.created_at, viaProLink);

  return NextResponse.redirect(new URL(next, url.origin));
}
