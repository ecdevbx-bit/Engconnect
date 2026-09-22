import "server-only";

import { fail } from "./http";
import { db, must } from "./supabase";

// Admin-editable settings documents, stored as JSON rows in app_settings.
// Defaults live here; a missing row (or missing field) means "use default".
// Each document has a validator enforcing the same ranges the admin UI shows.

export type JumbleSettings = { progressiveSetBonusXp: number };

export type PronunciationTimings = {
  countdownMs: number;
  easyRecordDurationMs: number;
  mediumRecordDurationMs: number;
  hardRecordDurationMs: number;
};

export type AIPartnerRewards = {
  thresholdSeconds: number;
  thresholdXp: number;
  recurringIntervalSeconds: number;
  recurringXp: number;
  maxRecordingSeconds: number;
  sessionSeconds: number;
  proDailyCapSeconds: number;
  freeWeeklyCapSeconds: number;
};

// Free-tier daily limits. 0 = unlimited. Pro learners are never limited.
export type Quotas = {
  jumblePerDifficultyPerDay: number;
  pronunciationPerDifficultyPerDay: number;
};

export type ProTrialSettings = { endsOn: string; durationDays: number; maxApprovals: number };

export type ProInviteSettings = {
  active: boolean;
  endsOn: string;
  showEndsOn: string;
  durationDays: number;
  maxRedemptions: number;
};

type Docs = {
  jumble: JumbleSettings;
  pronunciation_timings: PronunciationTimings;
  ai_partner_rewards: AIPartnerRewards;
  quotas: Quotas;
  pro_trial: ProTrialSettings;
  pro_invite: ProInviteSettings;
};

export const DEFAULTS: Docs = {
  jumble: { progressiveSetBonusXp: 10 },
  pronunciation_timings: {
    countdownMs: 5000,
    easyRecordDurationMs: 6000,
    mediumRecordDurationMs: 8000,
    hardRecordDurationMs: 12000,
  },
  // Talk-time XP: first reward after 15 s of speaking, then +30 XP per extra
  // minute (= the "+150 XP per 5 minutes" promise on the start card).
  ai_partner_rewards: {
    thresholdSeconds: 15,
    thresholdXp: 10,
    recurringIntervalSeconds: 60,
    recurringXp: 30,
    maxRecordingSeconds: 20,
    sessionSeconds: 600,
    proDailyCapSeconds: 1200,
    freeWeeklyCapSeconds: 1200,
  },
  quotas: { jumblePerDifficultyPerDay: 18, pronunciationPerDifficultyPerDay: 3 },
  pro_trial: { endsOn: "", durationDays: 14, maxApprovals: 100 },
  pro_invite: { active: false, endsOn: "", showEndsOn: "", durationDays: 30, maxRedemptions: 0 },
};

type Key = keyof Docs;

export async function getSettings<K extends Key>(key: K): Promise<Docs[K]> {
  const { data } = await db().from("app_settings").select("value").eq("key", key).maybeSingle();
  return { ...DEFAULTS[key], ...((data?.value as Partial<Docs[K]>) ?? {}) };
}

export function validateSettings<K extends Key>(key: K, value: Docs[K]): Docs[K] {
  return validate(key, value);
}

export async function putSettings<K extends Key>(key: K, value: Docs[K], by: string): Promise<Docs[K]> {
  const clean = validate(key, value);
  must(
    await db().from("app_settings").upsert({ key, value: clean, updated_by: by }).select("key"),
    `save settings ${key}`,
  );
  return clean;
}

function num(v: unknown, field: string, min: number, max: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n < min || n > max) {
    throw fail.badRequest(`${field} must be between ${min} and ${max}.`, { [field]: "range" });
  }
  return Math.round(n);
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function dateOr(v: unknown, field: string, allowed: string[]): string {
  const s = typeof v === "string" ? v.trim() : "";
  if (allowed.includes(s) || DATE_RE.test(s)) return s;
  throw fail.badRequest(`${field} must be YYYY-MM-DD or one of: ${allowed.map((a) => `"${a}"`).join(", ")}.`);
}

function validate<K extends Key>(key: K, raw: Docs[K]): Docs[K] {
  const v = (raw ?? {}) as Record<string, unknown>;
  switch (key) {
    case "jumble":
      return { progressiveSetBonusXp: num(v.progressiveSetBonusXp, "progressiveSetBonusXp", 0, 1000) } as Docs[K];
    case "pronunciation_timings":
      return {
        countdownMs: num(v.countdownMs, "countdownMs", 1000, 30000),
        easyRecordDurationMs: num(v.easyRecordDurationMs, "easyRecordDurationMs", 1000, 60000),
        mediumRecordDurationMs: num(v.mediumRecordDurationMs, "mediumRecordDurationMs", 1000, 60000),
        hardRecordDurationMs: num(v.hardRecordDurationMs, "hardRecordDurationMs", 1000, 60000),
      } as Docs[K];
    case "ai_partner_rewards":
      return {
        thresholdSeconds: num(v.thresholdSeconds, "thresholdSeconds", 1, 600),
        thresholdXp: num(v.thresholdXp, "thresholdXp", 0, 1000),
        recurringIntervalSeconds: num(v.recurringIntervalSeconds, "recurringIntervalSeconds", 1, 600),
        recurringXp: num(v.recurringXp, "recurringXp", 0, 1000),
        maxRecordingSeconds: num(v.maxRecordingSeconds, "maxRecordingSeconds", 1, 120),
        sessionSeconds: num(v.sessionSeconds, "sessionSeconds", 60, 3600),
        proDailyCapSeconds: num(v.proDailyCapSeconds, "proDailyCapSeconds", 0, 86400),
        freeWeeklyCapSeconds: num(v.freeWeeklyCapSeconds, "freeWeeklyCapSeconds", 0, 604800),
      } as Docs[K];
    case "quotas":
      return {
        jumblePerDifficultyPerDay: num(v.jumblePerDifficultyPerDay, "jumblePerDifficultyPerDay", 0, 10000),
        pronunciationPerDifficultyPerDay: num(
          v.pronunciationPerDifficultyPerDay,
          "pronunciationPerDifficultyPerDay",
          0,
          10000,
        ),
      } as Docs[K];
    case "pro_trial":
      return {
        endsOn: dateOr(v.endsOn, "endsOn", ["", "none"]),
        durationDays: num(v.durationDays, "durationDays", 1, 60),
        maxApprovals: num(v.maxApprovals, "maxApprovals", 0, 1_000_000),
      } as Docs[K];
    case "pro_invite":
      return {
        active: Boolean(v.active),
        endsOn: dateOr(v.endsOn, "endsOn", ["", "none"]),
        showEndsOn: dateOr(v.showEndsOn, "showEndsOn", [""]),
        durationDays: num(v.durationDays, "durationDays", 1, 365),
        maxRedemptions: num(v.maxRedemptions, "maxRedemptions", 0, 1_000_000),
      } as Docs[K];
    default:
      throw fail.badRequest(`Unknown settings document ${String(key)}`);
  }
}
