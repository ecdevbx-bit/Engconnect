import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Next 16 "proxy" (formerly middleware). Keeps the Supabase session cookie
// fresh so server components (dashboard gate) see a valid session, and sends
// signed-in visitors of "/" to their dashboard. Not an authorization layer — /api handlers verify the
// Bearer token themselves (src/server/guards.ts).
export async function proxy(request: NextRequest) {
  // No Supabase session cookie → nothing to verify or refresh. Most page hits
  // (the landing, /login, Learn pages, bots) are signed out; skipping the
  // client + getClaims() there keeps them off Vercel's CPU bill.
  if (!request.cookies.getAll().some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"))) {
    return NextResponse.next({ request });
  }

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
  const { data } = await supabase.auth.getClaims();

  // Signed in → the landing isn't for you. Done here (not in app/page.tsx) so
  // the landing itself can be a static, CDN-cached page for everyone else.
  if (request.nextUrl.pathname === "/" && data?.claims?.sub) {
    const redirect = NextResponse.redirect(new URL("/dashboard", request.url));
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }
  return response;
}

export const config = {
  // Pages only: skip the API (Bearer-authenticated), auth callbacks (they set
  // cookies themselves), the Sentry tunnel, Next internals and static files.
  // Only when a Supabase session cookie is present (single or chunked ".0"):
  // signed-out visits (most of the landing, /login, bots) then never start a
  // function — a static page comes straight from the CDN. The names carry the
  // Supabase project ref because matchers must be constants: on a new project,
  // update them, or the proxy never runs (no "/" → dashboard redirect).
  matcher: [
    {
      source:
        "/((?!api/|auth/|monitoring|_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|js)$).*)",
      has: [{ type: "cookie", key: "sb-uycpxwajvhcigyhvepci-auth-token" }],
    },
    {
      source:
        "/((?!api/|auth/|monitoring|_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|js)$).*)",
      has: [{ type: "cookie", key: "sb-uycpxwajvhcigyhvepci-auth-token.0" }],
    },
  ],
};
