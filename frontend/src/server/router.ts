import "server-only";

import { ApiFailure, errorResponse, fail } from "./http";

// Tiny method+path router. The whole backend API is declared as one table
// (server/routes/index.ts) so the contract is readable in one place, like the
// old Go router it replaces. Mounted by app/api/[...path]/route.ts.

export type Ctx = {
  req: Request;
  params: Record<string, string>;
  query: URLSearchParams;
};

export type Handler = (ctx: Ctx) => Promise<Response>;

export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type Route = { method: Method; parts: string[]; handler: Handler };

export class Router {
  private routes: Route[] = [];

  on(method: Method, pattern: string, handler: Handler): this {
    this.routes.push({ method, parts: split(pattern), handler });
    return this;
  }

  async dispatch(req: Request, path: string): Promise<Response> {
    try {
      const parts = split(path);
      let pathMatched = false;
      for (const r of this.routes) {
        const params = match(r.parts, parts);
        if (!params) continue;
        pathMatched = true;
        if (r.method !== req.method) continue;
        return await r.handler({ req, params, query: new URL(req.url).searchParams });
      }
      if (pathMatched) {
        throw new ApiFailure(405, "METHOD_NOT_ALLOWED", `${req.method} not allowed here.`);
      }
      throw fail.notFound(`No API route for ${req.method} /api/${parts.join("/")}`);
    } catch (err) {
      return errorResponse(err);
    }
  }
}

function split(p: string): string[] {
  // Trailing slashes are ignored (the word bank calls /api/word-bank/).
  return p.split("/").filter(Boolean);
}

function match(pattern: string[], parts: string[]): Record<string, string> | null {
  if (pattern.length !== parts.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < pattern.length; i++) {
    const p = pattern[i];
    if (p.startsWith(":")) {
      params[p.slice(1)] = decodeURIComponent(parts[i]);
    } else if (p !== parts[i]) {
      return null;
    }
  }
  return params;
}
