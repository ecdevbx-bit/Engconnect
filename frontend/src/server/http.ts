import "server-only";

import * as Sentry from "@sentry/nextjs";
import { after } from "next/server";

// Response envelope shared with the frontend (lib/apiClient.ts):
//   success → { success: true,  message, data }
//   failure → { success: false, message, errorCode, traceId, timestamp }
// Every response is JSON, including 404/500, because several clients call
// res.json() without guarding.

export class ApiFailure extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiFailure";
  }
}

export const fail = {
  badRequest: (message: string, fieldErrors?: Record<string, string>) =>
    new ApiFailure(400, "BAD_REQUEST", message, fieldErrors),
  unauthorized: (message = "Please sign in again.") => new ApiFailure(401, "UNAUTHORIZED", message),
  forbidden: (message = "You don't have access to this.", code = "FORBIDDEN") =>
    new ApiFailure(403, code, message),
  notFound: (message = "Not found.") => new ApiFailure(404, "NOT_FOUND", message),
  conflict: (message: string, code = "CONFLICT") => new ApiFailure(409, code, message),
  quota: (message: string) => new ApiFailure(429, "DAILY_QUOTA_REACHED", message),
  unavailable: (message: string, code = "UNAVAILABLE") => new ApiFailure(503, code, message),
};

export function ok<T>(data: T, message = "OK", status = 200): Response {
  return Response.json({ success: true, message, data }, { status, headers: { "Cache-Control": "no-store" } });
}

// Send queued Sentry events before Vercel freezes the function (the SDK's own
// request wrapping isn't applied to Turbopack builds).
function flushSentrySoon(): void {
  try {
    after(() => Sentry.flush(2000));
  } catch {
    // outside a request scope — nothing to wait for
  }
}

export function errorResponse(err: unknown): Response {
  const traceId = crypto.randomUUID().slice(0, 8);
  if (err instanceof ApiFailure) {
    // 5xx we answer on purpose (K.AI busy / at capacity / unavailable) are
    // worth counting, not paging: one Sentry issue per code, as a warning.
    if (err.status >= 500) {
      Sentry.captureMessage(`API ${err.status} ${err.code}: ${err.message}`, {
        level: "warning",
        fingerprint: ["api-failure", err.code],
        tags: { traceId, errorCode: err.code },
      });
      flushSentrySoon();
    }
    return Response.json(
      {
        success: false,
        message: err.message,
        errorCode: err.code,
        traceId,
        timestamp: new Date().toISOString(),
        ...(err.fieldErrors ? { fieldErrors: err.fieldErrors } : {}),
      },
      { status: err.status, headers: { "Cache-Control": "no-store" } },
    );
  }
  console.error(`[api] unhandled error trace=${traceId}`, err);
  // The learner sees this traceId; searching it in Sentry finds the stack.
  Sentry.captureException(err, { tags: { traceId } });
  flushSentrySoon();
  return Response.json(
    {
      success: false,
      message: "Something went wrong on our side. Please try again.",
      errorCode: "INTERNAL",
      traceId,
      timestamp: new Date().toISOString(),
    },
    { status: 500, headers: { "Cache-Control": "no-store" } },
  );
}

export async function readJson<T = Record<string, unknown>>(req: Request): Promise<T> {
  const text = await req.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw fail.badRequest("Request body must be valid JSON.");
  }
}

// Small validation helpers — enough for this API without a schema library.
export function str(v: unknown, field: string, opts: { max?: number; required?: boolean } = {}): string {
  if (v === undefined || v === null) {
    if (opts.required) throw fail.badRequest(`${field} is required.`, { [field]: "required" });
    return "";
  }
  if (typeof v !== "string") throw fail.badRequest(`${field} must be text.`, { [field]: "invalid" });
  const s = v.trim();
  if (opts.required && !s) throw fail.badRequest(`${field} is required.`, { [field]: "required" });
  if (opts.max && s.length > opts.max) {
    throw fail.badRequest(`${field} is too long (max ${opts.max}).`, { [field]: "too_long" });
  }
  return s;
}

export function int(
  v: unknown,
  field: string,
  opts: { min?: number; max?: number; fallback?: number } = {},
): number {
  const n = typeof v === "string" && v.trim() !== "" ? Number(v) : typeof v === "number" ? v : NaN;
  if (!Number.isFinite(n)) {
    if (opts.fallback !== undefined) return opts.fallback;
    throw fail.badRequest(`${field} must be a number.`, { [field]: "invalid" });
  }
  const r = Math.round(n);
  if (opts.min !== undefined && r < opts.min) throw fail.badRequest(`${field} must be ≥ ${opts.min}.`, { [field]: "range" });
  if (opts.max !== undefined && r > opts.max) throw fail.badRequest(`${field} must be ≤ ${opts.max}.`, { [field]: "range" });
  return r;
}
