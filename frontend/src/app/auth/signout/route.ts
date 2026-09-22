import { NextResponse, type NextRequest } from "next/server";

import { supabaseServer } from "@/lib/supabase/server";

// Server-side sign-out (clears the cookie session on THIS device only), used
// when a server component detects a stale/superseded session.
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const supabase = await supabaseServer();
  await supabase.auth.signOut({ scope: "local" });
  const reason = url.searchParams.get("reason");
  return NextResponse.redirect(new URL(reason ? `/login?reason=${encodeURIComponent(reason)}` : "/login", url.origin));
}
