import type { EmailOtpType } from "@supabase/supabase-js";
import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { PRO_LINK_COOKIE } from "@/lib/proInvite";
import { supabaseServer } from "@/lib/supabase/server";
import { maybeGrantProLink, recordLogin } from "@/server/domain/session";

// Landing point for every auth email link (our templates point here with
// ?token_hash=…&type=…): sign-up confirmation, password recovery, email
// change. Verifies server-side, sets the cookie session, then routes on.
export const dynamic = "force-dynamic";

const TYPES: EmailOtpType[] = ["signup", "email", "recovery", "invite", "magiclink", "email_change"];

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  if (!tokenHash || !type || !TYPES.includes(type)) {
    return NextResponse.redirect(new URL("/login?error=link_invalid", url.origin));
  }

  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  if (error || !data.session || !data.user) {
    return NextResponse.redirect(new URL("/login?error=link_expired", url.origin));
  }

  const sid = jwtDecode<{ session_id?: string }>(data.session.access_token).session_id ?? "";
  await recordLogin(data.user.id, sid);

  if (type === "recovery") {
    return NextResponse.redirect(new URL("/reset-password", url.origin));
  }

  const jar = await cookies();
  const viaProLink = jar.get(PRO_LINK_COOKIE)?.value === "1";
  if (viaProLink) jar.delete(PRO_LINK_COOKIE);
  await maybeGrantProLink(data.user.id, data.user.created_at, viaProLink);

  return NextResponse.redirect(new URL("/dashboard?welcome=1", url.origin));
}
