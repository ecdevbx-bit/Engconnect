// Tiny shared admin gate used by both the server component page and every
// server action in this folder. Returns the authenticated email when the
// caller is an admin; throws otherwise.
//
// The allow-list lives in env (ADMIN_EMAILS=foo@bar.com,baz@qux.com). This
// is a stopgap until we wire Cognito group-based admin auth — sufficient
// for a single-admin internal panel.

import { auth } from "@/auth";

export class NotAdminError extends Error {
  constructor() {
    super("not authorised");
    this.name = "NotAdminError";
  }
}

export async function requireAdmin(): Promise<string> {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase().trim();
  if (!email) throw new NotAdminError();

  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length === 0 || !allowed.includes(email)) {
    throw new NotAdminError();
  }
  return email;
}

// Call our own /api in-process (DECISIONS D-018): the admin actions keep their
// fetch-shaped code, but the request is dispatched straight to the API router —
// no network hop, no dependency on the public URL or deployment protection.
export async function backendFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { api } = await import("@/server/routes");
  const headers = new Headers(init.headers);
  headers.set("x-internal-api-key", internalAPIKey());
  const url = new URL(path, "http://internal");
  const req = new Request(url, { method: init.method ?? "GET", headers, body: init.body });
  return api.dispatch(req, url.pathname.replace(/^\/api\/?/, ""));
}

export function internalAPIKey(): string {
  const key = process.env.INTERNAL_API_KEY;
  if (!key) {
    throw new Error("INTERNAL_API_KEY not set on the frontend server env");
  }
  return key;
}
