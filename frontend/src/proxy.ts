import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Next 16 "proxy" (formerly middleware). Its only job: keep the Supabase
// session cookie fresh so server components (dashboard gate, landing redirect)
// see a valid session. Not an authorization layer — /api handlers verify the
// Bearer token themselves (src/server/guards.ts).
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // Verifies the JWT and refreshes it when it's about to expire.
  await supabase.auth.getClaims();
  return response;
}

export const config = {
  // Pages only: skip the API (Bearer-authenticated), auth callbacks (they set
  // cookies themselves), the Sentry tunnel, Next internals and static files.
  matcher: [
    "/((?!api/|auth/|monitoring|_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|js)$).*)",
  ],
};
