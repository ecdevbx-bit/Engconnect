import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cookie-backed Supabase client for server components, route handlers and
// server actions. Server components can't write cookies — that's fine, the
// proxy (src/proxy.ts) refreshes the session before they render.
export async function supabaseServer() {
  const store = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) => store.set(name, value, options));
          } catch {
            // Called from a server component — read-only cookies. Safe to ignore.
          }
        },
      },
    },
  );
}
