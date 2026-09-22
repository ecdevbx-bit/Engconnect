// Free Pro-trial + feedback API. Cognito-authed via v3Fetch. Launch model:
// apply → admin approves → the user gets unrestricted Pro through the program's
// shared end date (`endsOn`), granted on approval, no daily feedback required.
// The end date is the SAME for everyone regardless of when they joined, so copy
// should promise "until <date>", never "for N days".
// Feedback is still collected but no longer affects Pro access.

import { v3Fetch } from "@/lib/apiClient";

export type TrialStatus = "" | "pending" | "approved" | "cancelled";

export type TrialWindowState = "none" | "active" | "after";

export interface V3TrialStatus {
  status: TrialStatus;
  windowState: TrialWindowState;
  endsOn: string; // "YYYY-MM-DD" (IST, inclusive) — shared program end date; "" if unset
  durationDays: number; // legacy per-user length; meaningless while endsOn is set
  inWindow: boolean; // approved AND before the program end date
  submittedToday: boolean; // already earned today's Pro day
  daysClaimed: number; // Pro days earned so far
  approvedAt: string; // ISO — activation day (window start)
  expiresAt: string; // ISO — exclusive end of this user's window (empty if not approved)
  proUntil: string; // ISO
  isPro: boolean;
  phone: string;
}

// fmtTrialEndsOn renders the inclusive "YYYY-MM-DD" cutoff as a human date.
// Parsed field-by-field on purpose: `new Date("2026-08-31")` is UTC midnight and
// would render as the 30th for anyone west of UTC.
export function fmtTrialEndsOn(endsOn: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(endsOn.trim());
  if (!m) return "";
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

export interface V3FeedbackResult {
  proGrantedToday: boolean;
  trial: V3TrialStatus;
}

export function v3FetchTrialStatus(accessToken: string): Promise<V3TrialStatus> {
  return v3Fetch<V3TrialStatus>("/trial/status", accessToken);
}

export function v3ApplyForTrial(accessToken: string, phone: string): Promise<V3TrialStatus> {
  return v3Fetch<V3TrialStatus>("/trial/apply", accessToken, {
    method: "POST",
    body: { phone },
  });
}

export function v3SubmitFeedback(accessToken: string, text: string): Promise<V3FeedbackResult> {
  return v3Fetch<V3FeedbackResult>("/feedback", accessToken, {
    method: "POST",
    body: { text },
  });
}
