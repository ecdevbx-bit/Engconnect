import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { env } from "./env";

// Service-role client: bypasses RLS. Server code only — this key must never
// reach a browser bundle ("server-only" enforces that at build time).
let admin: SupabaseClient | null = null;

export function db(): SupabaseClient {
  if (!admin) {
    admin = createClient(env.supabaseUrl(), env.supabaseSecretKey(), {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return admin;
}

// Publishable-key client for auth flows run on the server (Google id_token
// exchange, refresh, JWT verification). Stateless: nothing is persisted.
export function authClient(): SupabaseClient {
  return createClient(env.supabaseUrl(), env.supabasePublishableKey(), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

// Unwrap a Supabase response, turning an error into an exception.
export function must<T>(res: { data: T | null; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  return res.data as T;
}
