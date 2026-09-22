"use client";

// One retry path for "Unauthorized": a page left open longer than the access
// token's lifetime sends an expired JWT and the API answers 401. Supabase
// refreshes the session on getSession(), so we swap in the new token and try
// the request again (see v3Fetch and the pronunciation upload).
export async function freshAccessToken(stale: string): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const { supabaseBrowser } = await import("./supabase/browser");
    const { data } = await supabaseBrowser().auth.getSession();
    const token = data.session?.access_token ?? null;
    return token && token !== stale ? token : null;
  } catch {
    return null; // signed out or storage blocked — let the 401 surface
  }
}
