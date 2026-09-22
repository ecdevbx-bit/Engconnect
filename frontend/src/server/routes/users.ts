import "server-only";

import {
  getAttributes,
  getProfile,
  isProRow,
  liveStreak,
  toProfileDto,
  type ProfileRow,
} from "../domain/users";
import { requireInternal, requireUser } from "../guards";
import { fail, int, ok, readJson, str } from "../http";
import type { Router } from "../router";
import { db, must } from "../supabase";

const AVATAR_RE = /^(notionists|pixel-art|lorelei|dylan):[A-Za-z0-9_-]{1,64}$/;
const NATIVE_LANGS = ["English", "Hindi", "Bengali", "Gujarati", "Marathi", "Tamil", "Telugu"];
const STATUSES = ["student", "working", "looking_for_work", "homemaker", "retired", "other"];
const REASONS = ["career", "studies", "travel", "confidence", "family", "other"];

function hobbiesString(v: unknown): string {
  const list = Array.isArray(v) ? v : typeof v === "string" ? v.split(",") : [];
  return list
    .map((h) => String(h).trim())
    .filter(Boolean)
    .slice(0, 10)
    .map((h) => h.slice(0, 40))
    .join(", ");
}

export function registerUserRoutes(r: Router) {
  r.on("GET", "/users/me", async ({ req }) => {
    const u = await requireUser(req);
    return ok(toProfileDto(await getProfile(u.id)));
  });

  // Partial update; only fields present in the body change.
  r.on("PATCH", "/users/me", async ({ req }) => {
    const u = await requireUser(req);
    const body = await readJson(req);
    const patch: Partial<ProfileRow> = {};
    if ("name" in body) {
      const name = str(body.name, "name", { max: 60 });
      if (!name) throw fail.badRequest("Name can't be empty.", { name: "required" });
      patch.name = name;
    }
    if ("phone" in body) patch.phone = str(body.phone, "phone", { max: 20 });
    if ("location" in body) patch.location = str(body.location, "location", { max: 80 });
    if ("nativeLang" in body) {
      const l = str(body.nativeLang, "nativeLang", { max: 30 });
      if (l && !NATIVE_LANGS.includes(l)) throw fail.badRequest("Unsupported language.", { nativeLang: "invalid" });
      patch.native_lang = l;
    }
    if ("currentStatus" in body) patch.current_status = str(body.currentStatus, "currentStatus", { max: 40 });
    if ("englishReason" in body) patch.english_reason = str(body.englishReason, "englishReason", { max: 40 });
    if ("goals" in body) patch.goals = str(body.goals, "goals", { max: 500 });
    if ("hobbies" in body) patch.hobbies = hobbiesString(body.hobbies);
    if ("avatar" in body) {
      const a = str(body.avatar, "avatar", { max: 80 });
      if (a && !AVATAR_RE.test(a)) throw fail.badRequest("Unsupported avatar.", { avatar: "invalid" });
      patch.avatar = a;
    }
    if (Object.keys(patch).length > 0) {
      must(await db().from("profiles").update(patch).eq("id", u.id).select("id"), "update profile");
    }
    return ok(toProfileDto(await getProfile(u.id)), "Profile updated");
  });

  // Onboarding wizard: write everything and flip onboardingCompleted at once.
  r.on("POST", "/users/me/onboarding", async ({ req }) => {
    const u = await requireUser(req);
    const body = await readJson(req);
    const nativeLang = str(body.nativeLang, "nativeLang", { required: true });
    const currentStatus = str(body.currentStatus, "currentStatus", { required: true });
    const englishReason = str(body.englishReason, "englishReason", { required: true });
    if (!NATIVE_LANGS.includes(nativeLang)) throw fail.badRequest("Unsupported language.", { nativeLang: "invalid" });
    if (!STATUSES.includes(currentStatus)) throw fail.badRequest("Unsupported status.", { currentStatus: "invalid" });
    if (!REASONS.includes(englishReason)) throw fail.badRequest("Unsupported reason.", { englishReason: "invalid" });
    must(
      await db()
        .from("profiles")
        .update({
          native_lang: nativeLang,
          location: str(body.location, "location", { max: 80 }),
          current_status: currentStatus,
          english_reason: englishReason,
          goals: str(body.goals, "goals", { max: 500 }),
          hobbies: hobbiesString(body.hobbies),
          onboarding_completed: true,
        })
        .eq("id", u.id)
        .select("id"),
      "save onboarding",
    );
    // "Welcome Aboard" lands silently in the badge deck.
    await db().rpc("grant_badge", { p_user: u.id, p_badge: "onboarding:1" });
    return ok(toProfileDto(await getProfile(u.id)), "Onboarding saved");
  });

  r.on("GET", "/users/me/attributes", async ({ req }) => {
    const u = await requireUser(req);
    const a = await getAttributes(u.id);
    const { data: badges } = await db().from("user_badges").select("badge_id").eq("user_id", u.id);
    const streak = liveStreak(a);
    return ok({
      sub: u.id,
      xp: a.xp,
      currentLevel: a.current_level,
      activityStreak: streak,
      streak,
      badges: (badges ?? []).map((b) => b.badge_id as string),
      cursors: a.cursors ?? {},
      combos: a.combos ?? {},
      createdAt: a.created_at,
    });
  });

  r.on("GET", "/users/me/activity", async ({ req, query }) => {
    const u = await requireUser(req);
    const limit = int(query.get("limit"), "limit", { min: 1, max: 500, fallback: 20 });
    const rows = must(
      await db()
        .from("activity")
        .select("category, difficulty, problem_order, xp_earned, created_at")
        .eq("user_id", u.id)
        .order("created_at", { ascending: false })
        .limit(limit),
      "load activity",
    ) as { category: string; difficulty: string; problem_order: number; xp_earned: number; created_at: string }[];
    return ok(
      rows.map((x) => ({
        sub: u.id,
        category: x.category,
        difficulty: x.difficulty,
        problemOrder: x.problem_order,
        xpEarned: x.xp_earned,
        timestamp: new Date(x.created_at).toISOString(),
      })),
    );
  });

  r.on("GET", "/users/me/badges", async ({ req }) => {
    const u = await requireUser(req);
    const rows = must(
      await db().from("user_badges").select("badge_id").eq("user_id", u.id).order("earned_at"),
      "load badges",
    ) as { badge_id: string }[];
    return ok(rows.map((b) => b.badge_id));
  });

  // Server-to-server (NextAuth callbacks) — kept for contract compatibility.
  r.on("GET", "/users/internal/:sub", async ({ req, params }) => {
    await requireInternal(req);
    const p = await getProfile(params.sub);
    return ok(toProfileDto(p));
  });

  r.on("POST", "/debug/clientlog", async ({ req }) => {
    await requireInternal(req);
    console.error("[clientlog]", JSON.stringify(await readJson(req)).slice(0, 2000));
    return ok(null);
  });

  // ── levels ──
  r.on("GET", "/levels", async () => ok(await listLevels()));

  // ── leaderboard ──
  r.on("GET", "/leaderboard", async ({ req, query }) => {
    const u = await requireUser(req);
    const mode = query.get("mode");
    const metric = mode === "streak" || mode === "weekly" ? mode : "xp";
    const meRadius = int(query.get("meRadius"), "meRadius", { min: 0, max: 50, fallback: 4 });
    const topN = query.has("top") ? int(query.get("top"), "top", { min: 0, max: 100 }) : 0;

    const rows = must(await db().rpc("leaderboard_rows", { p_metric: metric }), "leaderboard") as {
      rank: number;
      user_id: string;
      name: string;
      avatar: string | null;
      value: number;
    }[];
    const entry = (x: (typeof rows)[number]) => ({
      rank: Number(x.rank),
      sub: x.user_id,
      name: x.name,
      ...(x.avatar ? { avatar: x.avatar } : {}),
      value: Number(x.value),
    });
    const meIdx = rows.findIndex((x) => x.user_id === u.id);
    const me =
      meIdx >= 0
        ? {
            rank: Number(rows[meIdx].rank),
            entries: rows.slice(Math.max(0, meIdx - meRadius), meIdx + meRadius + 1).map(entry),
          }
        : null;
    return ok({
      metric,
      total: rows.length,
      ...(topN > 0 ? { top: rows.slice(0, topN).map(entry) } : {}),
      me,
      estimate: null,
    });
  });

  // ── public feature flags ──
  r.on("GET", "/flags", async () => {
    const rows = must(await db().from("feature_flags").select("key, enabled"), "flags") as {
      key: string;
      enabled: boolean;
    }[];
    return ok(Object.fromEntries(rows.map((f) => [f.key, f.enabled])));
  });

  // Deepgram is gone: AI Partner transcribes with Gemini Live itself. The
  // endpoint stays so any old client falls back cleanly to the browser engine.
  r.on("GET", "/stt/token", async ({ req }) => {
    await requireUser(req);
    return ok({ provider: "browser", reason: "AI Partner now transcribes with Gemini Live" });
  });

  // Used by the Pro card etc. — cheap entitlement check.
  r.on("GET", "/users/me/entitlement", async ({ req }) => {
    const u = await requireUser(req);
    const p = await getProfile(u.id);
    return ok({ pro: isProRow(p), premiumUntil: p.premium_until });
  });
}

export async function listLevels() {
  return must(
    await db().from("levels").select("level, threshold, title, icon").order("level"),
    "levels",
  ) as { level: number; threshold: number; title: string; icon: string }[];
}
