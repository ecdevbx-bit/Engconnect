import "server-only";

import { after } from "next/server";

import { activeProblems, claimDailyReward, findProblem, parseDifficulty } from "../domain/problems";
import { awardProgress, bumpUsage, getAttributes, isPro, setCursor, usageToday } from "../domain/users";
import { scorePronunciation } from "../gemini/scoring";
import { requireUser } from "../guards";
import { fail, int, ok, readJson, str } from "../http";
import { putObject } from "../r2";
import type { Router } from "../router";
import { getSettings } from "../settings";
import { db, must } from "../supabase";

// Pronunciation Coach — see docs/wiki/features/pronunciation.md.
//
// Rules:
//  * Phrases come from a per-learner cursor per difficulty; the cursor moves
//    past a phrase when an attempt on it is scored, so "Next sentence" always
//    lands on a fresh phrase (sessionOffset from the client is informational).
//  * Scoring: Gemini judges each expected word; accuracy = correct / total.
//  * XP = round(base × accuracy), base easy 20 · medium 30 · hard 40; paid at
//    most once per phrase per IST day. Combo continues at ≥ 80 %.
//  * Free learners: N scored attempts per difficulty per day (admin quota).
//  * Recordings are kept in Cloudflare R2 when configured.

type PDifficulty = "easy" | "medium" | "hard";
const BASE_XP: Record<PDifficulty, number> = { easy: 20, medium: 30, hard: 40 };
const MAX_AUDIO_BYTES = 6 * 1024 * 1024;

const bucket = (d: PDifficulty) => `pronunciation:${d}`;

function feedbackTier(pct: number) {
  if (pct >= 90) return "EXCELLENT";
  if (pct >= 80) return "GREAT";
  if (pct >= 55) return "SOLID";
  if (pct >= 40) return "GETTING_THERE";
  return "KEEP_GOING";
}

function xpTier(accuracy: number) {
  if (accuracy >= 0.8) return "HIGH";
  if (accuracy >= 0.55) return "MID";
  return "NEEDS_REVIEW";
}

// Identify the real container from magic bytes — Safari's mp4 recordings
// arrive named ".wav", so the filename can't be trusted.
function sniffAudio(buf: Buffer, declared: string): string {
  if (buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WAVE") return "audio/wav";
  if (buf.length >= 4 && buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return "audio/webm";
  if (buf.length >= 4 && buf.toString("ascii", 0, 4) === "OggS") return "audio/ogg";
  if (buf.length >= 8 && buf.toString("ascii", 4, 8) === "ftyp") return "audio/mp4";
  if (buf.length >= 3 && (buf.toString("ascii", 0, 3) === "ID3" || (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0))) return "audio/mp3";
  if (buf.length >= 4 && buf.toString("ascii", 0, 4) === "fLaC") return "audio/flac";
  return declared.split(";")[0] || "application/octet-stream";
}

const EXT: Record<string, string> = {
  "audio/wav": "wav",
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/mp3": "mp3",
  "audio/flac": "flac",
};

const WORD_RE = /^[a-z][a-z'-]*$/;

function normaliseWord(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/^[^a-z]+|[^a-z]+$/g, "");
}

export function registerPronunciationRoutes(r: Router) {
  r.on("GET", "/pronunciation/phrases", async ({ req, query }) => {
    const u = await requireUser(req);
    const d = parseDifficulty(query.get("difficulty"), false) as PDifficulty;

    const { pronunciationPerDifficultyPerDay: cap } = await getSettings("quotas");
    if (cap > 0 && !(await isPro(u.id)) && (await usageToday(u.id, bucket(d))) >= cap) {
      throw fail.quota(`You've used today's free ${d} sentences. Try another level or come back tomorrow.`);
    }

    const list = await activeProblems("pronunciation", d);
    if (list.length === 0) throw fail.notFound(`No ${d} sentences are available yet.`);
    const attrs = await getAttributes(u.id);
    const cursor = attrs.cursors?.[bucket(d)] ?? 0;
    const p = list[((cursor % list.length) + list.length) % list.length];
    const t = await getSettings("pronunciation_timings");
    const recordDurationMs =
      d === "easy" ? t.easyRecordDurationMs : d === "medium" ? t.mediumRecordDurationMs : t.hardRecordDurationMs;

    return ok({ sentence: p.final, order: p.sort_order, difficulty: d, countdownMs: t.countdownMs, recordDurationMs });
  });

  r.on("POST", "/pronunciation/attempts", async ({ req }) => {
    const u = await requireUser(req);
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      throw fail.badRequest("Send the recording as multipart/form-data.");
    }
    const audio = form.get("audio");
    if (!(audio instanceof Blob) || audio.size === 0) throw fail.badRequest("audio is required.", { audio: "required" });
    if (audio.size > MAX_AUDIO_BYTES) throw fail.badRequest("Recording is too long.", { audio: "too_large" });
    const d = parseDifficulty(String(form.get("difficulty") ?? ""), false) as PDifficulty;
    const order = int(form.get("order"), "order");
    const durationMs = int(form.get("durationMs"), "durationMs", { min: 0, max: 120_000, fallback: 0 });

    const p = await findProblem({ category: "pronunciation", difficulty: d, order });
    if (!p) throw fail.notFound("That sentence no longer exists. Load a new one.");

    const buf = Buffer.from(await audio.arrayBuffer());
    const mime = sniffAudio(buf, audio.type);

    const score = await scorePronunciation({ userId: u.id, expectedText: p.final, audio: buf, mimeType: mime });
    const accuracyPercent = Math.floor(score.accuracy * 100);
    const baseXp = Math.round(BASE_XP[d] * score.accuracy);
    const paid = baseXp > 0 ? await claimDailyReward(u.id, p.id, baseXp) : false;
    const xp = paid ? baseXp : 0;

    // Move this learner past the phrase and count today's free-tier usage.
    const list = await activeProblems("pronunciation", d);
    const idx = list.findIndex((x) => x.id === p.id);
    if (idx >= 0) await setCursor(u.id, bucket(d), (idx + 1) % list.length);
    await bumpUsage(u.id, bucket(d));

    const progress = await awardProgress({
      userId: u.id,
      game: "pronunciation",
      xp,
      combo: score.accuracy >= 0.8 ? "inc" : "reset",
      difficulty: d,
      problemOrder: p.sort_order,
    });

    const attemptId = crypto.randomUUID();
    const ext = EXT[mime] ?? "bin";
    const audioKey = `pronunciation/${u.id}/${attemptId}.${ext}`;
    const row = must(
      await db()
        .from("pronunciation_attempts")
        .insert({
          id: attemptId,
          user_id: u.id,
          problem_id: p.id,
          problem_order: p.sort_order,
          difficulty: d,
          expected_text: p.final,
          transcript: score.transcript,
          accuracy: score.accuracy,
          accuracy_percent: accuracyPercent,
          tier: xpTier(score.accuracy),
          feedback_tier: feedbackTier(accuracyPercent),
          message: score.message,
          words: score.words,
          duration_ms: durationMs,
          xp_earned: xp,
          audio_mime: mime,
          scorer: score.scorer,
        })
        .select("created_at")
        .single(),
      "save attempt",
    ) as { created_at: string };

    // Keep the recording in R2 after responding (never slows the learner down).
    after(async () => {
      if (await putObject(audioKey, new Uint8Array(buf), mime)) {
        await db().from("pronunciation_attempts").update({ audio_key: audioKey }).eq("id", attemptId);
      }
    });

    return ok({
      attemptId,
      order: p.sort_order,
      difficulty: d,
      expectedText: p.final,
      transcript: score.transcript,
      accuracy: score.accuracy,
      accuracyPercent,
      tier: xpTier(score.accuracy),
      feedbackTier: feedbackTier(accuracyPercent),
      message: score.message,
      correctWords: score.words.filter((w) => w.status === "CORRECT").map((w) => w.expected),
      incorrectWords: score.words.filter((w) => w.status !== "CORRECT").map((w) => w.expected),
      words: score.words,
      durationMs,
      tips: score.tips,
      xpEarned: xp,
      totalXp: progress.totalXp,
      currentLevel: progress.currentLevel,
      leveledUp: progress.leveledUp,
      combo: progress.combo,
      newlyEarnedBadges: progress.newlyEarnedBadges,
      createdAt: new Date(row.created_at).toISOString(),
    });
  });

  r.on("GET", "/pronunciation/attempts", async ({ req, query }) => {
    const u = await requireUser(req);
    const limit = int(query.get("limit"), "limit", { min: 1, max: 200, fallback: 20 });
    const rows = must(
      await db()
        .from("pronunciation_attempts")
        .select("id, difficulty, expected_text, accuracy, accuracy_percent, tier, message, created_at")
        .eq("user_id", u.id)
        .order("created_at", { ascending: false })
        .limit(limit),
      "load attempts",
    ) as {
      id: string;
      difficulty: string;
      expected_text: string;
      accuracy: number;
      accuracy_percent: number;
      tier: string;
      message: string;
      created_at: string;
    }[];
    return ok({
      attempts: rows.map((a) => ({
        attemptId: a.id,
        difficulty: a.difficulty,
        expectedText: a.expected_text,
        accuracy: a.accuracy,
        accuracyPercent: a.accuracy_percent,
        tier: a.tier,
        message: a.message,
        createdAt: new Date(a.created_at).toISOString(),
      })),
    });
  });

  // ── Word Bank ─────────────────────────────────────────────────────
  const toEntry = (w: { word: string; source: string; created_at: string }) => ({
    word: w.word,
    source: w.source,
    createdAt: new Date(w.created_at).toISOString(),
  });

  r.on("GET", "/word-bank", async ({ req }) => {
    const u = await requireUser(req);
    const rows = must(
      await db().from("word_bank").select("word, source, created_at").eq("user_id", u.id).order("created_at", { ascending: false }),
      "load word bank",
    ) as { word: string; source: string; created_at: string }[];
    return ok({ words: rows.map(toEntry) });
  });

  r.on("POST", "/word-bank", async ({ req }) => {
    const u = await requireUser(req);
    const body = await readJson(req);
    const word = normaliseWord(str(body.word, "word", { required: true, max: 40 }));
    if (!WORD_RE.test(word)) {
      throw fail.badRequest("Please add a single English word (letters only).", { word: "invalid" });
    }
    const source = body.source === "pronunciation" ? "pronunciation" : "manual";
    const { data: inserted, error } = await db()
      .from("word_bank")
      .upsert({ user_id: u.id, word, source }, { onConflict: "user_id,word", ignoreDuplicates: true })
      .select("word, source, created_at");
    if (error) throw new Error(`save word: ${error.message}`);
    if (inserted && inserted.length > 0) return ok({ word: toEntry(inserted[0]), added: true }, "Word added");
    const existing = must(
      await db().from("word_bank").select("word, source, created_at").eq("user_id", u.id).eq("word", word).single(),
      "load word",
    ) as { word: string; source: string; created_at: string };
    return ok({ word: toEntry(existing), added: false }, "Already in your word bank");
  });

  r.on("DELETE", "/word-bank/:word", async ({ req, params }) => {
    const u = await requireUser(req);
    const word = normaliseWord(params.word);
    must(await db().from("word_bank").delete().eq("user_id", u.id).eq("word", word).select("word"), "delete word");
    return ok(null, "Word removed");
  });
}
