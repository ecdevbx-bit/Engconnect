import "server-only";

import { after } from "next/server";

import { awardProgress, getProfile, isProRow, type ProfileRow } from "../domain/users";
import { heartbeatLease, releaseLease, classifyGeminiError, type Outcome } from "../gemini/keyPool";
import { grantLiveSession, LIVE_LEASE_TTL_SECONDS, type LiveGrant } from "../gemini/liveToken";
import { compileSessionMemory } from "../gemini/memory";
import { buildKickoff, buildSystemPrompt, type LearnerContext } from "../gemini/tutorPrompt";
import { isAdminEmail, requireUser, type AuthedUser } from "../guards";
import { ApiFailure, fail, ok, readJson } from "../http";
import type { Router } from "../router";
import { getSettings, type AIPartnerRewards } from "../settings";
import { db, must } from "../supabase";

// AI Partner (K.AI on Gemini Live) — see docs/wiki/features/ai-partner.md and
// DECISIONS.md D-004/D-007. The browser talks to Gemini directly with a token
// from POST /chat/sessions; this API owns access, time caps, XP, transcripts,
// key leases and fail-over.
//
//   POST   /chat/sessions                 start: caps check + key lease + token
//   POST   /chat/sessions/:id/progress    heartbeat: talk-time XP, cap, transcript
//   POST   /chat/sessions/:id/reconnect   new token (key failed or token expired)
//   POST   /chat/sessions/:id/end         finish: final XP, release key, memory
//   DELETE /chat/sessions/:id             same as /end (old contract)
//   GET    /chat/usage | /chat/access

type SessionRow = {
  id: string;
  user_id: string;
  language: string;
  level: string;
  status: string;
  lease_id: string | null;
  started_at: string;
  billed_seconds: number;
  speaking_seconds: number;
  user_words: number;
  milestones_awarded: number;
  xp_awarded: number;
};

const STALE_AFTER_SECONDS = 150;

// ── time windows & caps ─────────────────────────────────────────────

function istMidnight(daysAgo = 0): Date {
  const ist = new Date(Date.now() + 5.5 * 3600_000);
  const d = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate() - daysAgo);
  return new Date(d - 5.5 * 3600_000);
}

function windowStart(pro: boolean): Date {
  if (pro) return istMidnight(0); // Pro: daily, IST
  const ist = new Date(Date.now() + 5.5 * 3600_000);
  const sinceMonday = (ist.getUTCDay() + 6) % 7; // Free: weekly, Monday IST
  return istMidnight(sinceMonday);
}

async function usedSeconds(userId: string, since: Date, excludeSession?: string): Promise<number> {
  let q = db().from("chat_sessions").select("id, billed_seconds").eq("user_id", userId).gte("started_at", since.toISOString());
  if (excludeSession) q = q.neq("id", excludeSession);
  const rows = must(await q, "usage") as { billed_seconds: number }[];
  return rows.reduce((s, r) => s + (r.billed_seconds ?? 0), 0);
}

async function usageFor(profile: ProfileRow, rewards: AIPartnerRewards, excludeSession?: string) {
  const pro = isProRow(profile);
  const cap = pro ? rewards.proDailyCapSeconds : rewards.freeWeeklyCapSeconds;
  const used = await usedSeconds(profile.id, windowStart(pro), excludeSession);
  return { pro, used, cap, remaining: cap > 0 ? Math.max(0, cap - used) : 0 };
}

async function hasAccess(u: AuthedUser, profile: ProfileRow): Promise<boolean> {
  if (profile.ai_partner_access || isAdminEmail(u.email)) return true;
  const { data } = await db().from("feature_flags").select("enabled").eq("key", "englishconnection-ai-partner").maybeSingle();
  return data?.enabled === true;
}

// ── XP milestones ───────────────────────────────────────────────────

function milestonesFor(speaking: number, r: AIPartnerRewards): number {
  return speaking < r.thresholdSeconds ? 0 : 1 + Math.floor((speaking - r.thresholdSeconds) / r.recurringIntervalSeconds);
}

function xpForMilestones(m: number, r: AIPartnerRewards): number {
  return m <= 0 ? 0 : r.thresholdXp + (m - 1) * r.recurringXp;
}

// ── helpers ─────────────────────────────────────────────────────────

async function loadSession(userId: string, id: string): Promise<SessionRow> {
  const s = must(
    await db().from("chat_sessions").select("*").eq("id", id).eq("user_id", userId).maybeSingle(),
    "load chat session",
  ) as SessionRow | null;
  if (!s) throw fail.notFound("Session not found.");
  return s;
}

async function learnerContext(profile: ProfileRow, level: string): Promise<LearnerContext> {
  const { data: mem } = await db().from("learner_memory").select("*").eq("user_id", profile.id).maybeSingle();
  return {
    name: profile.name,
    location: profile.location,
    nativeLang: profile.native_lang,
    currentStatus: profile.current_status,
    englishReason: profile.english_reason,
    goals: profile.goals,
    hobbies: profile.hobbies,
    level,
    memory: mem
      ? {
          summary: mem.summary ?? "",
          mistakes: (mem.mistakes ?? []) as { wrong: string; correct: string; why?: string }[],
          vocabulary: (mem.vocabulary ?? []) as { word: string; meaning?: string }[],
          sessions: mem.sessions ?? 0,
        }
      : null,
  };
}

function livePayload(g: LiveGrant, kickoff?: string) {
  return {
    token: g.token,
    wsUrl: g.wsUrl,
    model: g.model,
    apiVersion: g.apiVersion,
    expiresAt: g.expiresAt,
    ...(kickoff ? { kickoff } : {}),
  };
}

// End sessions whose tab disappeared without saying goodbye.
async function sweepStale(userId?: string) {
  const cutoff = new Date(Date.now() - STALE_AFTER_SECONDS * 1000).toISOString();
  let q = db().from("chat_sessions").update({ status: "ended", ended_at: new Date().toISOString(), end_reason: "stale" })
    .eq("status", "active").lt("last_heartbeat_at", cutoff);
  if (userId) q = q.eq("user_id", userId);
  const { data } = await q.select("id, user_id, lease_id");
  for (const s of data ?? []) {
    if (s.lease_id) await releaseLease(s.lease_id as string, "ok", "session went stale");
  }
}

type Turn = { role: "user" | "assistant"; text: string };

function parseTurns(v: unknown): Turn[] {
  if (!Array.isArray(v)) return [];
  return v
    .slice(0, 50)
    .map((t) => ({
      role: (t as Turn)?.role === "assistant" ? "assistant" : "user",
      text: String((t as Turn)?.text ?? "").trim().slice(0, 4000),
    }))
    .filter((t): t is Turn => t.text.length > 0);
}

const countWords = (s: string) => s.split(/\s+/).filter(Boolean).length;

// Apply a heartbeat (or the final /end): persist new transcript turns, clamp
// and bill time, award talk-time XP. Returns the speech_progress payload.
async function applyProgress(
  u: AuthedUser,
  s: SessionRow,
  body: Record<string, unknown>,
  final: boolean,
) {
  const rewards = await getSettings("ai_partner_rewards");
  const profile = await getProfile(u.id);

  const turns = parseTurns(body.turns);
  if (turns.length) {
    await db().from("chat_messages").insert(turns.map((t) => ({ session_id: s.id, user_id: u.id, role: t.role, body: t.text })));
  }
  const userWords = s.user_words + turns.filter((t) => t.role === "user").reduce((n, t) => n + countWords(t.text), 0);

  const elapsed = Math.max(0, Math.floor((Date.now() - new Date(s.started_at).getTime()) / 1000));
  // Talk-time can't exceed wall-clock, and needs real words behind it
  // (~2 s per recognised word + slack), so silent mic taps earn nothing.
  const claimed = Math.max(0, Math.floor(Number(body.speakingSeconds) || 0));
  const speaking = Math.max(s.speaking_seconds, Math.min(claimed, elapsed, userWords * 2 + 10));

  const usage = await usageFor(profile, rewards, s.id);
  const billed = usage.cap > 0 ? Math.min(elapsed, usage.remaining) : elapsed;
  const capReached = usage.cap > 0 && usage.used + elapsed >= usage.cap;

  const milestones = milestonesFor(speaking, rewards);
  const xp = Math.max(0, xpForMilestones(milestones, rewards) - xpForMilestones(s.milestones_awarded, rewards));

  const progress =
    xp > 0
      ? await awardProgress({ userId: u.id, game: "ai-partner", xp, combo: "inc", difficulty: s.level || "", problemOrder: 0 })
      : null;

  const pt = Math.max(0, Math.floor(Number((body.usage as { promptTokens?: number })?.promptTokens) || 0));
  const rt = Math.max(0, Math.floor(Number((body.usage as { responseTokens?: number })?.responseTokens) || 0));

  must(
    await db()
      .from("chat_sessions")
      .update({
        last_heartbeat_at: new Date().toISOString(),
        billed_seconds: billed,
        speaking_seconds: speaking,
        user_words: userWords,
        milestones_awarded: Math.max(milestones, s.milestones_awarded),
        xp_awarded: s.xp_awarded + xp,
        ...(pt ? { prompt_tokens: pt } : {}),
        ...(rt ? { response_tokens: rt } : {}),
        ...(final ? { status: "ended", ended_at: new Date().toISOString(), end_reason: String(body.reason ?? "ended").slice(0, 60) } : {}),
      })
      .eq("id", s.id)
      .select("id"),
    "update chat session",
  );

  if (!final && s.lease_id) await heartbeatLease(s.lease_id, LIVE_LEASE_TTL_SECONDS);

  let attrs = progress;
  if (!attrs) {
    const { data } = await db().from("user_attributes").select("xp, current_level, combos").eq("user_id", u.id).maybeSingle();
    attrs = {
      totalXp: data?.xp ?? 0,
      currentLevel: data?.current_level ?? 1,
      leveledUp: false,
      combo: (data?.combos as Record<string, number>)?.["ai-partner"] ?? 0,
      streak: 0,
      progressiveSets: 0,
      newlyEarnedBadges: [],
    };
  }
  const m = Math.max(milestones, s.milestones_awarded);
  return {
    type: "speech_progress" as const,
    totalSeconds: speaking,
    prevSeconds: s.speaking_seconds,
    wordsSpoken: userWords,
    milestonesAwarded: m,
    thresholdSeconds: rewards.thresholdSeconds,
    thresholdXp: rewards.thresholdXp,
    recurringInterval: rewards.recurringIntervalSeconds,
    recurringXp: rewards.recurringXp,
    nextMilestoneAt: m === 0 ? rewards.thresholdSeconds : rewards.thresholdSeconds + m * rewards.recurringIntervalSeconds,
    nextMilestoneXp: m === 0 ? rewards.thresholdXp : rewards.recurringXp,
    totalXp: attrs.totalXp,
    currentLevel: attrs.currentLevel,
    combo: attrs.combo,
    xpEarned: xp,
    leveledUp: attrs.leveledUp,
    newlyEarnedBadges: attrs.newlyEarnedBadges,
    // cap bookkeeping for the client timer
    usedSeconds: usage.used + billed,
    capSeconds: usage.cap,
    remainingSeconds: usage.cap > 0 ? Math.max(0, usage.cap - usage.used - elapsed) : 0,
    capReached,
  };
}

// ── routes ──────────────────────────────────────────────────────────

export function registerChatRoutes(r: Router) {
  r.on("GET", "/chat/access", async ({ req }) => {
    const u = await requireUser(req);
    return ok({ enabled: await hasAccess(u, await getProfile(u.id)) });
  });

  r.on("GET", "/chat/usage", async ({ req }) => {
    const u = await requireUser(req);
    const rewards = await getSettings("ai_partner_rewards");
    const usage = await usageFor(await getProfile(u.id), rewards);
    return ok({ pro: usage.pro, usedSeconds: usage.used, capSeconds: usage.cap, remainingSeconds: usage.remaining, rewards });
  });

  r.on("POST", "/chat/sessions", async ({ req }) => {
    const u = await requireUser(req);
    const body = await readJson(req);
    const profile = await getProfile(u.id);
    if (!(await hasAccess(u, profile))) {
      throw fail.forbidden("AI Partner isn't available on your account yet.", "AI_PARTNER_DISABLED");
    }

    await sweepStale(u.id);
    // One live conversation per learner: close any other open session.
    const { data: open } = await db().from("chat_sessions").select("id, lease_id").eq("user_id", u.id).eq("status", "active");
    for (const o of open ?? []) {
      await db().from("chat_sessions").update({ status: "ended", ended_at: new Date().toISOString(), end_reason: "replaced" }).eq("id", o.id);
      if (o.lease_id) await releaseLease(o.lease_id as string, "ok", "replaced by a new session");
    }

    const rewards = await getSettings("ai_partner_rewards");
    const usage = await usageFor(profile, rewards);
    if (usage.cap > 0 && usage.remaining <= 0) {
      throw new ApiFailure(
        429,
        "AI_TIME_LIMIT_REACHED",
        usage.pro ? "You've used today's K.AI time. Come back tomorrow!" : "You've used this week's free K.AI time.",
      );
    }

    const language = typeof body.language === "string" && body.language.trim() ? body.language.trim().slice(0, 30) : "English";
    const level = typeof body.level === "string" ? body.level.trim().slice(0, 30) : "";
    const ctx = await learnerContext(profile, level);
    const systemPrompt = buildSystemPrompt(ctx, language);
    const budget = usage.cap > 0 ? usage.remaining : rewards.sessionSeconds;

    const grant = await grantLiveSession({ userId: u.id, systemPrompt, sessionSeconds: budget });
    const session = must(
      await db()
        .from("chat_sessions")
        .insert({ user_id: u.id, language, level, model: grant.model, lease_id: grant.leaseId, voice: "" })
        .select("id")
        .single(),
      "create chat session",
    ) as { id: string };

    // Combo for AI Partner = milestones reached in this conversation.
    await awardProgress({ userId: u.id, game: "ai-partner", xp: 0, combo: "reset", log: false });

    return ok({
      sessionID: session.id,
      language,
      level,
      rewards,
      aiUsedSeconds: usage.used,
      aiCapSeconds: usage.cap,
      live: livePayload(grant, buildKickoff(ctx, language)),
    });
  });

  r.on("POST", "/chat/sessions/:id/progress", async ({ req, params }) => {
    const u = await requireUser(req);
    const s = await loadSession(u.id, params.id);
    if (s.status !== "active") {
      return ok({ ...(await applyProgress(u, s, {}, false)), sessionActive: false });
    }
    const progress = await applyProgress(u, s, await readJson(req), false);
    return ok({ ...progress, sessionActive: true });
  });

  // The browser's Gemini socket failed. If the key was the problem (quota,
  // invalid), mark it and move this session to another key; otherwise just
  // issue a fresh token (e.g. the old one expired).
  r.on("POST", "/chat/sessions/:id/reconnect", async ({ req, params }) => {
    const u = await requireUser(req);
    const s = await loadSession(u.id, params.id);
    if (s.status !== "active") throw fail.conflict("This conversation has ended.", "SESSION_ENDED");
    const body = await readJson(req);
    const detail = String(body.detail ?? "").slice(0, 500);
    const closeCode = Number(body.closeCode) || undefined;

    let outcome: Outcome = "ok";
    const exclude: string[] = [];
    if (body.keyFailed === true || closeCode === 1011 || closeCode === 1008) {
      outcome = classifyGeminiError(undefined, detail);
      if (outcome === "ok") outcome = "error";
    }
    if (s.lease_id) {
      const { data: lease } = await db().from("gemini_key_leases").select("key_id").eq("id", s.lease_id).maybeSingle();
      if (lease?.key_id && outcome !== "ok") exclude.push(lease.key_id as string);
      await releaseLease(s.lease_id, outcome, detail || "reconnect");
    }

    const profile = await getProfile(u.id);
    const rewards = await getSettings("ai_partner_rewards");
    const usage = await usageFor(profile, rewards, s.id);
    const elapsed = Math.floor((Date.now() - new Date(s.started_at).getTime()) / 1000);
    const left = usage.cap > 0 ? Math.max(0, usage.cap - usage.used - elapsed) : Math.max(60, rewards.sessionSeconds - elapsed);
    if (usage.cap > 0 && left <= 0) {
      throw new ApiFailure(429, "AI_TIME_LIMIT_REACHED", "Your K.AI time for this period is used up.");
    }

    const grant = await grantLiveSession({
      userId: u.id,
      systemPrompt: buildSystemPrompt(await learnerContext(profile, s.level), s.language),
      sessionSeconds: left,
      exclude,
    });
    await db().from("chat_sessions").update({ lease_id: grant.leaseId, model: grant.model }).eq("id", s.id);
    return ok({ live: livePayload(grant) });
  });

  const endHandler = async (req: Request, id: string) => {
    const u = await requireUser(req);
    const s = await loadSession(u.id, id);
    const body = req.method === "DELETE" ? {} : await readJson(req);
    if (s.status !== "active") return ok({ ended: true });
    const progress = await applyProgress(u, s, body, true);
    if (s.lease_id) {
      const outcome = (typeof body.outcome === "string" ? body.outcome : "ok") as Outcome;
      const valid: Outcome[] = ["ok", "quota_daily", "quota_minute", "concurrency", "invalid", "error"];
      await releaseLease(s.lease_id, valid.includes(outcome) ? outcome : "ok", String(body.detail ?? "").slice(0, 500), progress.totalSeconds);
    }
    // Learn from the conversation after responding.
    after(async () => {
      try {
        await compileSessionMemory(u.id, s.id);
      } catch (err) {
        console.warn("[memory] compile failed:", err instanceof Error ? err.message : err);
      }
    });
    return ok({ ended: true, progress });
  };

  r.on("POST", "/chat/sessions/:id/end", ({ req, params }) => endHandler(req, params.id));
  r.on("DELETE", "/chat/sessions/:id", ({ req, params }) => endHandler(req, params.id));
}

export { sweepStale };
