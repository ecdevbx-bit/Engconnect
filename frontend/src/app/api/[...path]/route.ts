// Single entry point for the backend API (everything under /api except
// NextAuth's /api/auth/*, which has its own, more specific route).
// The route table lives in src/server/routes/index.ts.

import type { NextRequest } from "next/server";

import { api } from "@/server/routes";

// Always run on Node (Supabase service client, node:crypto, Gemini SDK) and
// never cache — every response is per-user.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Pronunciation scoring + Gemini token minting can take a few seconds.
export const maxDuration = 60;

// The raw (still %-encoded) path after /api/: the router decodes each
// segment itself and answers a malformed escape with a JSON 4xx. Awaiting
// Next's decoded `params` threw on "%E0%A4" and produced an HTML 500 page.
async function handle(req: NextRequest): Promise<Response> {
  const raw = new URL(req.url).pathname.replace(/^\/api\/?/, "");
  return api.dispatch(req, raw);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
