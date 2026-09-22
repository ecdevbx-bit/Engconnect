import "server-only";

import { fail } from "../http";
import { db, must } from "../supabase";

// Profile row ⇄ the camelCase shapes the frontend already speaks
// (EcaiUser / V3MeProfile in lib/apiClient.ts + lib/v3Game.ts).

export type ProfileRow = {
  id: string;
  email: string;
  name: string;
  phone: string;
  location: string;
  native_lang: string;
  current_status: string;
  english_reason: string;
  goals: string;
  hobbies: string;
  avatar: string;
  onboarding_completed: boolean;
  premium_until: string | null;
  active_session_id: string | null;
  ai_partner_access: boolean;
  created_at: string;
};

export type ProfileDto = {
  sub: string;
  email: string;
  name: string;
  phone: string;
  location: string;
  nativeLang: string;
  currentStatus: string;
  englishReason: string;
  goals: string;
  hobbies: string;
  avatar: string;
  onboardingCompleted: boolean;
  createdAt: string;
  premiumUntil?: string;
};

export function toProfileDto(p: ProfileRow): ProfileDto {
  return {
    sub: p.id,
    email: p.email,
    name: p.name,
    phone: p.phone,
    location: p.location,
    nativeLang: p.native_lang,
    currentStatus: p.current_status,
    englishReason: p.english_reason,
    goals: p.goals,
    hobbies: p.hobbies,
    avatar: p.avatar,
    onboardingCompleted: p.onboarding_completed,
    createdAt: p.created_at,
    ...(p.premium_until ? { premiumUntil: new Date(p.premium_until).toISOString() } : {}),
  };
}

export async function getProfile(userId: string): Promise<ProfileRow> {
  const row = must(
    await db().from("profiles").select("*").eq("id", userId).maybeSingle(),
    "load profile",
  ) as ProfileRow | null;
  if (!row) throw fail.notFound("Profile not found.");
  return row;
}

export function isProRow(p: Pick<ProfileRow, "premium_until">): boolean {
  return !!p.premium_until && new Date(p.premium_until).getTime() > Date.now();
}

export async function isPro(userId: string): Promise<boolean> {
  const { data } = await db().from("profiles").select("premium_until").eq("id", userId).maybeSingle();
  return !!data && isProRow(data as { premium_until: string | null });
}

// Push premium_until forward (never backwards) — every grant path uses this.
export async function extendPremium(userId: string, until: Date): Promise<string> {
  const p = await getProfile(userId);
  const current = p.premium_until ? new Date(p.premium_until) : null;
  const next = current && current > until ? current : until;
  must(
    await db().from("profiles").update({ premium_until: next.toISOString() }).eq("id", userId).select("id"),
    "extend premium",
  );
  return next.toISOString();
}

// ── attributes ─────────────────────────────────────────────────────

export type AttributesRow = {
  user_id: string;
  xp: number;
  current_level: number;
  activity_streak: number;
  best_streak: number;
  last_active_day: string | null;
  combos: Record<string, number>;
  cursors: Record<string, number>;
  progressive_sets: number;
  created_at: string;
};

export async function getAttributes(userId: string): Promise<AttributesRow> {
  const existing = must(
    await db().from("user_attributes").select("*").eq("user_id", userId).maybeSingle(),
    "load attributes",
  ) as AttributesRow | null;
  if (existing) return existing;
  // Users created before the trigger existed (or a race on first sign-in).
  return must(
    await db().from("user_attributes").upsert({ user_id: userId }).select("*").single(),
    "create attributes",
  ) as AttributesRow;
}

// The streak shown to the learner: a streak whose last active day is older
// than yesterday (IST) is already broken, even if no action has reset it yet.
export function liveStreak(a: Pick<AttributesRow, "activity_streak" | "last_active_day">): number {
  if (!a.last_active_day) return 0;
  const today = istDate(new Date());
  const yesterday = istDate(new Date(Date.now() - 86_400_000));
  return a.last_active_day === today || a.last_active_day === yesterday ? a.activity_streak : 0;
}

export function istDate(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d);
}

export async function setCursor(userId: string, key: string, value: number): Promise<void> {
  const a = await getAttributes(userId);
  must(
    await db()
      .from("user_attributes")
      .update({ cursors: { ...a.cursors, [key]: value } })
      .eq("user_id", userId)
      .select("user_id"),
    "save cursor",
  );
}

// ── progress engine (Postgres function award_progress) ─────────────

export type ProgressResult = {
  totalXp: number;
  currentLevel: number;
  leveledUp: boolean;
  combo: number;
  streak: number;
  progressiveSets: number;
  newlyEarnedBadges: string[];
};

export async function awardProgress(args: {
  userId: string;
  game: "jumble" | "pronunciation" | "ai-partner";
  xp: number;
  combo: "inc" | "reset" | "keep";
  difficulty?: string;
  problemOrder?: number;
  log?: boolean;
  progset?: boolean;
}): Promise<ProgressResult> {
  const data = must(
    await db().rpc("award_progress", {
      p_user: args.userId,
      p_game: args.game,
      p_xp: Math.max(0, Math.round(args.xp)),
      p_combo: args.combo,
      p_difficulty: args.difficulty ?? "",
      p_problem_order: args.problemOrder ?? 0,
      p_log: args.log ?? true,
      p_progset: args.progset ?? false,
    }),
    "award progress",
  ) as ProgressResult;
  return { ...data, newlyEarnedBadges: data.newlyEarnedBadges ?? [] };
}

// Free-tier daily counters (IST day). cap <= 0 ⇒ unlimited.
export async function usageToday(userId: string, bucket: string): Promise<number> {
  const { data } = await db()
    .from("daily_usage")
    .select("used")
    .eq("user_id", userId)
    .eq("bucket", bucket)
    .eq("day", istDate(new Date()))
    .maybeSingle();
  return (data?.used as number | undefined) ?? 0;
}

export async function bumpUsage(userId: string, bucket: string): Promise<void> {
  must(
    await db().rpc("bump_daily_usage", { p_user: userId, p_bucket: bucket, p_cap: 0, p_amount: 1 }),
    "bump usage",
  );
}
