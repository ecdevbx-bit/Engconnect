import "server-only";

import {
  activeProblems,
  claimDailyReward,
  findProblem,
  parseDifficulty,
  scramble,
  tokens,
  type Difficulty,
  type ProblemRow,
} from "../domain/problems";
import { awardProgress, bumpUsage, getAttributes, isPro, istDate, setCursor, usageToday } from "../domain/users";
import { getJumbleClue } from "../gemini/jumbleClue";
import { requireUser } from "../guards";
import { fail, int, ok, readJson } from "../http";
import type { Router } from "../router";
import { getSettings } from "../settings";
import { db } from "../supabase";

// Jumble Words — see docs/wiki/features/jumble-words.md for the learner's view.
//
// Rules:
//  * A round is 6 sentences, all at the chosen difficulty, served from a
//    per-learner cursor per band. The cursor only moves on a CORRECT answer,
//    so unsolved sentences come back in the next round.
//  * The answer never leaves the server (except the level-3 "full" hint).
//  * Hints (D-043): a structure clue first (sentence type, tense, building
//    blocks in order, meaning in the learner's language), then words by level.
//    Seeing the full sentence (level 3) halves that sentence's XP today.
//  * XP: easy 10 · medium 15 · hard 25; progressive by variant 1/2/3+ →
//    10/15/25, plus the admin "set bonus" when the last variant of a set is
//    solved. XP for a given sentence is paid at most once per IST day.
//  * Free learners: N solved sentences per difficulty per day (admin quota).

const ROUND_SIZE = 6;
const XP_BY_DIFFICULTY: Record<Exclude<Difficulty, "progressive">, number> = { easy: 10, medium: 15, hard: 25 };

function xpFor(p: ProblemRow): number {
  if (p.difficulty === "progressive") {
    const v = p.variant ?? 1;
    return v <= 1 ? 10 : v === 2 ? 15 : 25;
  }
  return XP_BY_DIFFICULTY[p.difficulty];
}

const cursorKey = (d: Difficulty) => `jumble:${d}`;

async function enforceQuota(userId: string, d: Difficulty): Promise<void> {
  const { jumblePerDifficultyPerDay: cap } = await getSettings("quotas");
  if (cap <= 0 || (await isPro(userId))) return;
  const used = await usageToday(userId, cursorKey(d));
  if (used >= cap) {
    throw fail.quota(`You've finished today's free ${d} sentences. Try another level or come back tomorrow.`);
  }
}

async function lookup(body: { difficulty: Difficulty; order?: number; base?: number; variant?: number }) {
  const p = await findProblem({ category: "jumble", ...body });
  if (!p) throw fail.notFound("That sentence no longer exists. Start a new round.");
  return p;
}

// order/base/variant identify a sentence in GET query strings.
function lookupFromQuery(query: URLSearchParams) {
  return lookup({
    difficulty: parseDifficulty(query.get("difficulty")),
    order: query.has("order") ? int(query.get("order"), "order") : undefined,
    base: query.has("base") ? int(query.get("base"), "base") : undefined,
    variant: query.has("variant") ? int(query.get("variant"), "variant") : undefined,
  });
}

// Highest hint level the learner opened for this sentence today (0 = none).
async function hintLevelToday(userId: string, problemId: number): Promise<number> {
  const { data } = await db()
    .from("jumble_hint_uses")
    .select("max_level")
    .eq("user_id", userId)
    .eq("problem_id", problemId)
    .eq("day", istDate(new Date()))
    .maybeSingle();
  return (data?.max_level as number | undefined) ?? 0;
}

export function registerJumbleRoutes(r: Router) {
  r.on("GET", "/game/jumble/batch", async ({ req, query }) => {
    const u = await requireUser(req);
    const d = parseDifficulty(query.get("difficulty"));
    await enforceQuota(u.id, d);

    const list = await activeProblems("jumble", d);
    if (list.length === 0) return ok({ sentences: [] });

    const attrs = await getAttributes(u.id);
    const start = ((attrs.cursors?.[cursorKey(d)] ?? 0) % list.length + list.length) % list.length;
    const count = Math.min(ROUND_SIZE, list.length);
    const sentences = Array.from({ length: count }, (_, i) => {
      const p = list[(start + i) % list.length];
      return {
        position: i + 1,
        order: p.sort_order,
        difficulty: d,
        ...(d === "progressive" ? { progressiveBase: p.base, progressiveLevel: p.variant } : {}),
        shuffledWords: scramble(p),
      };
    });
    return ok({ sentences });
  });

  // Progressive hint: level 1 = first+last word, 2 = also 2nd and 2nd-last,
  // 3 = everything + the full sentence. Hidden words only reveal their length.
  // Structure clue (first hint): never reveals a word's position.
  r.on("GET", "/game/jumble/clue", async ({ req, query }) => {
    const u = await requireUser(req);
    const p = await lookupFromQuery(query);
    const { data: prof } = await db().from("profiles").select("native_lang").eq("id", u.id).maybeSingle();
    const clue = await getJumbleClue({
      userId: u.id,
      problemId: p.id,
      sentence: p.final,
      nativeLang: (prof?.native_lang as string | undefined) ?? "",
    });
    return ok(clue);
  });

  r.on("GET", "/game/jumble/hint", async ({ req, query }) => {
    const u = await requireUser(req);
    const level = int(query.get("level"), "level", { min: 1, max: 3 });
    const p = await lookupFromQuery(query);
    const { error: logErr } = await db().rpc("record_jumble_hint", { p_user: u.id, p_problem: p.id, p_level: level });
    if (logErr) console.warn("[jumble] could not record hint use:", logErr.message);
    const words = tokens(p.final);
    const n = words.length;
    const shown = new Set<number>();
    if (level >= 3) words.forEach((_, i) => shown.add(i));
    else {
      shown.add(0).add(n - 1);
      if (level >= 2) shown.add(1).add(n - 2);
    }
    return ok({
      level,
      words: words.map((w, i) =>
        shown.has(i) ? { word: w, length: w.length, revealed: true } : { length: w.length, revealed: false },
      ),
      ...(level >= 3 ? { full: words.join(" ") } : {}),
    });
  });

  r.on("POST", "/game/jumble/submit", async ({ req }) => {
    const u = await requireUser(req);
    const body = await readJson(req);
    const d = parseDifficulty(typeof body.difficulty === "string" ? body.difficulty : "");
    const answer = Array.isArray(body.userAnswer) ? body.userAnswer.map((w) => String(w).trim()) : null;
    if (!answer || answer.length === 0) throw fail.badRequest("userAnswer is required.");

    const p = await lookup({
      difficulty: d,
      order: body.order != null ? int(body.order, "order") : undefined,
      base: body.base != null ? int(body.base, "base") : undefined,
      variant: body.variant != null ? int(body.variant, "variant") : undefined,
    });
    const expected = tokens(p.final);
    const correct = answer.length === expected.length && answer.every((w, i) => w === expected[i]);

    if (!correct) {
      const res = await awardProgress({ userId: u.id, game: "jumble", xp: 0, combo: "reset", log: false });
      return ok({
        correct: false,
        xpEarned: 0,
        totalXp: res.totalXp,
        currentLevel: res.currentLevel,
        leveledUp: false,
        combo: res.combo,
        newlyEarnedBadges: [],
      });
    }

    // Progressive: is this the last variant of its set?
    let setComplete = false;
    const list = await activeProblems("jumble", d);
    if (d === "progressive") {
      const maxVariant = Math.max(...list.filter((x) => x.base === p.base).map((x) => x.variant ?? 0));
      setComplete = (p.variant ?? 0) >= maxVariant;
    }

    // The full sentence was shown (level-3 hint) → half XP for this one.
    const gaveAway = (await hintLevelToday(u.id, p.id)) >= 3;
    const baseXp = gaveAway ? Math.ceil(xpFor(p) / 2) : xpFor(p);
    const paid = await claimDailyReward(u.id, p.id, baseXp);
    const bonus = paid && setComplete ? (await getSettings("jumble")).progressiveSetBonusXp : 0;
    const xp = paid ? baseXp + bonus : 0;

    // Advance this band's cursor past the solved sentence.
    const idx = list.findIndex((x) => x.id === p.id);
    if (idx >= 0 && list.length > 0) await setCursor(u.id, cursorKey(d), (idx + 1) % list.length);
    await bumpUsage(u.id, cursorKey(d));

    const res = await awardProgress({
      userId: u.id,
      game: "jumble",
      xp,
      combo: "inc",
      difficulty: d === "progressive" ? ["easy", "medium", "hard"][Math.min((p.variant ?? 1) - 1, 2)] : d,
      problemOrder: p.sort_order,
      progset: setComplete && paid,
    });

    return ok({
      correct: true,
      xpEarned: xp,
      totalXp: res.totalXp,
      currentLevel: res.currentLevel,
      leveledUp: res.leveledUp,
      combo: res.combo,
      newlyEarnedBadges: res.newlyEarnedBadges,
      hintPenalty: gaveAway && paid,
      ...(d === "progressive" ? { progressiveSetComplete: setComplete, setBonusXp: bonus } : {}),
    });
  });
}
