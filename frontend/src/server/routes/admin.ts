import "server-only";

import { endOfIstDate, inviteEffectiveEndsOn, proInviteSignups, proInviteState, trialEnd } from "../domain/premium";
import { parseDifficulty, tokens, type ProblemRow } from "../domain/problems";
import { extendPremium } from "../domain/users";
import { requireInternal } from "../guards";
import { fail, int, ok, readJson, str } from "../http";
import type { Router } from "../router";
import { DEFAULTS, getSettings, putSettings, validateSettings } from "../settings";
import { db, must } from "../supabase";
import { listLevels } from "./users";

// Admin endpoints used by the /v3/admin/* pages (via server actions carrying
// INTERNAL_API_KEY) — contract unchanged from the old Go backend.

const LEVEL_ICONS = new Set([
  "Sparkles", "BookOpen", "Puzzle", "MessageCircle", "BookText", "Languages", "Mic", "Feather",
  "Globe2", "Crown", "Star", "Trophy", "Award", "Flame", "Zap", "Rocket",
]);
const BADGE_CATEGORIES = new Set(["xp", "streak", "combo", "progset", "onboarding"]);
const COMBO_GAMES = new Set(["jumble", "pronunciation", "ai-partner"]);

// ── problems ────────────────────────────────────────────────────────

function toProblemDto(p: ProblemRow) {
  return {
    category: p.category,
    order: p.sort_order,
    difficulty: p.difficulty,
    ...(p.difficulty === "progressive" ? { base: p.base ?? undefined, variant: p.variant ?? undefined } : {}),
    initial: p.initial,
    final: p.final,
    active: p.active,
    createdAt: new Date(p.created_at).toISOString(),
    updatedAt: new Date(p.updated_at).toISOString(),
  };
}

// sk = "easy#0000012" | "progressive#0000003#001" (see admin problems/actions.ts)
async function problemBySk(category: string, sk: string): Promise<ProblemRow> {
  const parts = sk.split("#");
  let q = db().from("problems").select("*").eq("category", category);
  if (parts[0] === "progressive" && parts.length === 3) {
    q = q.eq("difficulty", "progressive").eq("base", Number(parts[1])).eq("variant", Number(parts[2]));
  } else if (parts.length === 2) {
    q = q.eq("difficulty", parts[0]).eq("sort_order", Number(parts[1]));
  } else {
    throw fail.badRequest("Bad problem key.");
  }
  const row = must(await q.maybeSingle(), "find problem") as ProblemRow | null;
  if (!row) throw fail.notFound("Problem not found.");
  return row;
}

type ProblemInput = {
  category: "jumble" | "pronunciation";
  difficulty: "easy" | "medium" | "hard" | "progressive";
  order?: number;
  base?: number;
  variant?: number;
  initial: string;
  final: string;
  active: boolean;
};

function validateProblem(raw: Record<string, unknown>): ProblemInput {
  const category = raw.category === "pronunciation" ? "pronunciation" : raw.category === "jumble" ? "jumble" : null;
  if (!category) throw fail.badRequest('category must be "jumble" or "pronunciation".');
  const dRaw = String(raw.difficulty ?? "").toLowerCase();
  if (!["easy", "medium", "hard", "progressive"].includes(dRaw)) throw fail.badRequest("difficulty is invalid.");
  const difficulty = parseDifficulty(dRaw) as ProblemInput["difficulty"];
  if (difficulty === "progressive" && category !== "jumble") throw fail.badRequest("Progressive is Jumble-only.");
  const final = str(raw.final, "final", { required: true, max: 400 }).replace(/\s+/g, " ");
  const initial = category === "pronunciation" ? "" : str(raw.initial, "initial", { max: 400 }).replace(/\s+/g, " ");
  if (initial) {
    const a = tokens(initial).sort().join(" ");
    const b = tokens(final).sort().join(" ");
    if (a !== b) throw fail.badRequest("initial must contain exactly the same words as final.");
  }
  const out: ProblemInput = { category, difficulty, initial, final, active: raw.active === undefined ? true : Boolean(raw.active) };
  if (difficulty === "progressive") {
    out.base = int(raw.base, "base", { min: 1, max: 9_999_999 });
    out.variant = int(raw.variant, "variant", { min: 1, max: 999 });
  }
  if (raw.order !== undefined && raw.order !== null && raw.order !== "") out.order = int(raw.order, "order", { min: 1 });
  return out;
}

async function nextOrder(category: string, difficulty: string): Promise<number> {
  const { data } = await db()
    .from("problems")
    .select("sort_order")
    .eq("category", category)
    .eq("difficulty", difficulty)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return ((data?.sort_order as number | undefined) ?? 0) + 1;
}

async function upsertProblem(p: ProblemInput): Promise<{ row: ProblemRow; created: boolean }> {
  let existing: ProblemRow | null = null;
  if (p.difficulty === "progressive") {
    existing = (await db().from("problems").select("*").eq("category", p.category).eq("difficulty", "progressive")
      .eq("base", p.base!).eq("variant", p.variant!).maybeSingle()).data as ProblemRow | null;
  } else if (p.order) {
    existing = (await db().from("problems").select("*").eq("category", p.category).eq("difficulty", p.difficulty)
      .eq("sort_order", p.order).maybeSingle()).data as ProblemRow | null;
  }
  if (existing) {
    const row = must(
      await db().from("problems").update({ initial: p.initial, final: p.final, active: p.active }).eq("id", existing.id).select("*").single(),
      "update problem",
    ) as ProblemRow;
    return { row, created: false };
  }
  const row = must(
    await db()
      .from("problems")
      .insert({
        category: p.category,
        difficulty: p.difficulty,
        sort_order: p.order ?? (await nextOrder(p.category, p.difficulty)),
        base: p.base ?? null,
        variant: p.variant ?? null,
        initial: p.initial,
        final: p.final,
        active: p.active,
      })
      .select("*")
      .single(),
    "create problem",
  ) as ProblemRow;
  return { row, created: true };
}

// ── badges ──────────────────────────────────────────────────────────

type BadgeRow = { id: string; category: string; game: string | null; threshold: number; active: boolean; created_at: string; updated_at: string };

function toBadgeDto(b: BadgeRow) {
  return {
    id: b.id,
    category: b.category,
    ...(b.game ? { game: b.game } : {}),
    threshold: b.threshold,
    active: b.active,
    createdAt: new Date(b.created_at).toISOString(),
    updatedAt: new Date(b.updated_at).toISOString(),
  };
}

function validateBadge(raw: Record<string, unknown>) {
  const category = String(raw.category ?? "");
  if (!BADGE_CATEGORIES.has(category)) throw fail.badRequest("category must be xp, streak, combo, progset or onboarding.");
  let game: string | null = null;
  if (category === "combo") {
    game = String(raw.game ?? "");
    if (!COMBO_GAMES.has(game)) throw fail.badRequest("combo badges need game: jumble, pronunciation or ai-partner.");
  }
  const threshold = category === "onboarding" ? 1 : int(raw.threshold, "threshold", { min: 1, max: 10_000_000 });
  const id = category === "combo" ? `combo:${game}:${threshold}` : `${category}:${threshold}`;
  return { id, category, game, threshold };
}

// ── trials ──────────────────────────────────────────────────────────

async function trialList() {
  const settings = await getSettings("pro_trial");
  const apps = must(
    await db().from("pro_trial_applications").select("*").order("applied_at", { ascending: false }).limit(1000),
    "trial list",
  ) as { user_id: string; phone: string; status: string; applied_at: string; approved_at: string | null; expires_at: string | null; days_claimed: number }[];
  const ids = apps.map((a) => a.user_id);
  const { data: profiles } = ids.length
    ? await db().from("profiles").select("id, name, email, premium_until").in("id", ids)
    : { data: [] };
  const { data: fb } = ids.length
    ? await db().from("feedback").select("user_id, text, created_at, day").in("user_id", ids).order("created_at", { ascending: false })
    : { data: [] };
  const byId = new Map((profiles ?? []).map((p) => [p.id as string, p]));
  const iso = (v: string | null) => (v ? new Date(v).toISOString() : "");
  const applications = apps.map((a) => {
    const p = byId.get(a.user_id);
    return {
      sub: a.user_id,
      name: (p?.name as string) ?? "",
      email: (p?.email as string) ?? "",
      phone: a.phone,
      status: a.status,
      appliedAt: iso(a.applied_at),
      approvedAt: iso(a.approved_at),
      expiresAt: iso(a.expires_at),
      daysClaimed: a.days_claimed,
      isPro: !!p?.premium_until && new Date(p.premium_until as string).getTime() > Date.now(),
      feedback: (fb ?? [])
        .filter((f) => f.user_id === a.user_id)
        .map((f) => ({ text: f.text as string, at: new Date(f.created_at as string).toISOString(), date: f.day as string })),
    };
  });
  return {
    applications,
    approvedCount: apps.filter((a) => a.status === "approved").length,
    settings,
    defaults: DEFAULTS.pro_trial,
  };
}

async function inviteResponse() {
  const s = await proInviteState();
  return {
    settings: s.settings,
    defaults: DEFAULTS.pro_invite,
    path: "/pro",
    effectiveEndsOn: s.effectiveEndsOn,
    displayEndsOn: s.displayEndsOn,
    expired: s.expired,
    redeemed: s.redeemed,
    signups: await proInviteSignups(),
  };
}

// ── routes ──────────────────────────────────────────────────────────

export function registerAdminRoutes(r: Router) {
  // Problems
  r.on("GET", "/admin/problems", async ({ req, query }) => {
    await requireInternal(req);
    const category = query.get("category") === "pronunciation" ? "pronunciation" : "jumble";
    const rows = must(
      await db().from("problems").select("*").eq("category", category).order("difficulty").order("base", { nullsFirst: true }).order("variant").order("sort_order"),
      "list problems",
    ) as ProblemRow[];
    return ok(rows.map(toProblemDto));
  });

  r.on("POST", "/admin/problems", async ({ req }) => {
    await requireInternal(req);
    const input = validateProblem({ ...(await readJson(req)), order: undefined });
    if (input.difficulty === "progressive") {
      const { data: clash } = await db().from("problems").select("id").eq("category", "jumble").eq("difficulty", "progressive")
        .eq("base", input.base!).eq("variant", input.variant!).maybeSingle();
      if (clash) throw fail.conflict(`Progressive base ${input.base} variant ${input.variant} already exists.`);
    }
    const { row } = await upsertProblem(input);
    return ok(toProblemDto(row), "Problem added");
  });

  r.on("PATCH", "/admin/problems/:category/:sk/reorder", async ({ req, params }) => {
    await requireInternal(req);
    const body = await readJson(req);
    const newOrder = int(body.newOrder, "newOrder", { min: 1 });
    const a = await problemBySk(params.category, params.sk);
    if (a.difficulty === "progressive") throw fail.badRequest("Progressive rows are ordered by base/variant.");
    if (a.sort_order === newOrder) return ok(null);
    const { data: b } = await db().from("problems").select("id").eq("category", a.category).eq("difficulty", a.difficulty).eq("sort_order", newOrder).maybeSingle();
    // Swap through a temporary slot to respect the unique (category, difficulty, order) index.
    await db().from("problems").update({ sort_order: -a.id }).eq("id", a.id);
    if (b) await db().from("problems").update({ sort_order: a.sort_order }).eq("id", b.id);
    must(await db().from("problems").update({ sort_order: newOrder }).eq("id", a.id).select("id"), "reorder");
    return ok(null, "Reordered");
  });

  r.on("PATCH", "/admin/problems/:category/:sk/active", async ({ req, params }) => {
    await requireInternal(req);
    const body = await readJson(req);
    const p = await problemBySk(params.category, params.sk);
    must(await db().from("problems").update({ active: Boolean(body.active) }).eq("id", p.id).select("id"), "toggle problem");
    return ok(null, body.active ? "Activated" : "Deactivated");
  });

  // Validate every item first; if anything is invalid, write nothing.
  r.on("POST", "/admin/problems/bulk", async ({ req }) => {
    await requireInternal(req);
    const body = await readJson<{ problems?: unknown[] }>(req);
    const items = Array.isArray(body.problems) ? body.problems : [];
    if (items.length === 0) throw fail.badRequest("problems must be a non-empty array.");
    if (items.length > 2000) throw fail.badRequest("At most 2000 problems per upload.");
    const parsed: ProblemInput[] = [];
    const errors: { index: number; status: "failed"; error: string }[] = [];
    items.forEach((it, index) => {
      try {
        parsed.push(validateProblem((it ?? {}) as Record<string, unknown>));
      } catch (err) {
        errors.push({ index, status: "failed", error: err instanceof Error ? err.message : "invalid" });
      }
    });
    if (errors.length) {
      return Response.json(
        { success: false, message: `${errors.length} item(s) failed validation — nothing was saved.`, errorCode: "VALIDATION_FAILED", data: { results: errors } },
        { status: 400 },
      );
    }
    const results = [];
    for (let index = 0; index < parsed.length; index++) {
      try {
        const { row, created } = await upsertProblem(parsed[index]);
        results.push({ index, status: created ? "created" : "updated", category: row.category, difficulty: row.difficulty, order: row.sort_order });
      } catch (err) {
        results.push({ index, status: "failed", error: err instanceof Error ? err.message : "failed" });
      }
    }
    return ok({ results }, "Bulk upload applied");
  });

  // Badges
  r.on("GET", "/admin/badges", async ({ req }) => {
    await requireInternal(req);
    const rows = must(await db().from("badges").select("*").order("category").order("game").order("threshold"), "badges") as BadgeRow[];
    const grouped: Record<string, ReturnType<typeof toBadgeDto>[]> = {};
    for (const b of rows) (grouped[b.category] ??= []).push(toBadgeDto(b));
    return ok(grouped);
  });

  r.on("POST", "/admin/badges", async ({ req }) => {
    await requireInternal(req);
    const b = validateBadge(await readJson(req));
    const row = must(await db().from("badges").upsert({ ...b, active: true }).select("*").single(), "add badge") as BadgeRow;
    return ok(toBadgeDto(row), "Badge saved");
  });

  r.on("PATCH", "/admin/badges/:id/active", async ({ req, params }) => {
    await requireInternal(req);
    const body = await readJson(req);
    const res = must(await db().from("badges").update({ active: Boolean(body.active) }).eq("id", params.id).select("id"), "toggle badge") as unknown[];
    if (res.length === 0) throw fail.notFound("Badge not found.");
    return ok(null);
  });

  r.on("POST", "/admin/badges/bulk", async ({ req }) => {
    await requireInternal(req);
    const body = await readJson<{ badges?: unknown[] }>(req);
    const items = Array.isArray(body.badges) ? body.badges : [];
    const parsed: ReturnType<typeof validateBadge>[] = [];
    const errors: { index: number; status: "failed"; category?: string; error: string }[] = [];
    items.forEach((it, index) => {
      try {
        parsed.push(validateBadge((it ?? {}) as Record<string, unknown>));
      } catch (err) {
        errors.push({ index, status: "failed", error: err instanceof Error ? err.message : "invalid" });
      }
    });
    if (errors.length || items.length === 0) {
      return Response.json(
        { success: false, message: items.length ? "Validation failed — nothing was saved." : "badges must be a non-empty array.", errorCode: "VALIDATION_FAILED", data: { results: errors } },
        { status: 400 },
      );
    }
    const { data: existing } = await db().from("badges").select("id").in("id", parsed.map((p) => p.id));
    const have = new Set((existing ?? []).map((e) => e.id as string));
    must(await db().from("badges").upsert(parsed.map((p) => ({ ...p, active: true }))).select("id"), "bulk badges");
    return ok({ results: parsed.map((p, index) => ({ index, status: have.has(p.id) ? "updated" : "created", id: p.id, category: p.category })) });
  });

  r.on("POST", "/admin/badges/refresh", async ({ req }) => {
    await requireInternal(req);
    return ok(null, "Badge catalog is read live from the database — nothing to refresh.");
  });

  // Levels
  r.on("GET", "/admin/levels", async ({ req }) => {
    await requireInternal(req);
    return ok(await listLevels());
  });

  r.on("PUT", "/admin/levels", async ({ req }) => {
    await requireInternal(req);
    const body = await readJson<{ levels?: { threshold: number; title: string; icon: string }[] }>(req);
    const list = Array.isArray(body.levels) ? body.levels : [];
    if (list.length === 0) throw fail.badRequest("At least one level is required.");
    const clean = list.map((l, i) => {
      const threshold = int(l.threshold, `levels[${i}].threshold`, { min: 0 });
      const title = str(l.title, `levels[${i}].title`, { required: true, max: 40 });
      const icon = String(l.icon ?? "");
      if (!LEVEL_ICONS.has(icon)) throw fail.badRequest(`levels[${i}].icon "${icon}" isn't allowed.`);
      return { level: i + 1, threshold, title, icon };
    });
    if (clean[0].threshold !== 0) throw fail.badRequest("Level 1 must start at 0 XP.");
    for (let i = 1; i < clean.length; i++) {
      if (clean[i].threshold <= clean[i - 1].threshold) throw fail.badRequest(`Level ${i + 1} must need more XP than level ${i}.`);
    }
    must(await db().from("levels").delete().gte("level", 1).select("level"), "clear levels");
    must(await db().from("levels").insert(clean).select("level"), "save levels");
    await db().rpc("recompute_levels");
    return ok(await listLevels(), "Levels saved");
  });

  // Settings documents
  const settingsDoc = (path: string, key: "ai_partner_rewards" | "pronunciation_timings" | "jumble" | "quotas") => {
    r.on("GET", path, async ({ req }) => {
      await requireInternal(req);
      return ok({ current: await getSettings(key), defaults: DEFAULTS[key] });
    });
    r.on("PUT", path, async ({ req }) => {
      const { by } = await requireInternal(req);
      const current = await putSettings(key, (await readJson(req)) as never, by);
      return ok({ current, defaults: DEFAULTS[key] }, "Saved");
    });
  };
  settingsDoc("/admin/ai-partner/rewards", "ai_partner_rewards");
  settingsDoc("/admin/pronunciation/timings", "pronunciation_timings");
  settingsDoc("/admin/jumble/settings", "jumble");
  settingsDoc("/admin/quotas", "quotas");

  // Feature flags
  const flagList = async () =>
    ({
      flags: must(await db().from("feature_flags").select("key, enabled, description").order("key"), "flags") as {
        key: string;
        enabled: boolean;
        description: string;
      }[],
    });
  r.on("GET", "/admin/feature-flags", async ({ req }) => {
    await requireInternal(req);
    return ok(await flagList());
  });
  r.on("PUT", "/admin/feature-flags", async ({ req }) => {
    await requireInternal(req);
    const body = await readJson<{ flags?: Record<string, boolean> }>(req);
    for (const [key, enabled] of Object.entries(body.flags ?? {})) {
      await db().from("feature_flags").update({ enabled: Boolean(enabled) }).eq("key", key);
    }
    return ok(await flagList(), "Flags saved");
  });

  // Pro trials
  r.on("GET", "/admin/pro-trials", async ({ req }) => {
    await requireInternal(req);
    return ok(await trialList());
  });

  r.on("POST", "/admin/pro-trials/approve", async ({ req }) => {
    await requireInternal(req);
    const sub = str((await readJson(req)).sub, "sub", { required: true });
    const settings = await getSettings("pro_trial");
    if (/^\d{4}-\d{2}-\d{2}$/.test(settings.endsOn) && endOfIstDate(settings.endsOn).getTime() <= Date.now()) {
      throw fail.conflict("The trial program has ended — approving now would grant nothing.");
    }
    const { count } = await db().from("pro_trial_applications").select("user_id", { count: "exact", head: true }).eq("status", "approved");
    if (settings.maxApprovals > 0 && (count ?? 0) >= settings.maxApprovals) {
      throw fail.conflict(`Approval limit (${settings.maxApprovals}) reached.`);
    }
    const now = new Date();
    const end = trialEnd(settings, now);
    must(
      await db().from("pro_trial_applications").update({ status: "approved", approved_at: now.toISOString(), expires_at: end.toISOString() }).eq("user_id", sub).select("user_id"),
      "approve trial",
    );
    await extendPremium(sub, end);
    return ok(await trialList(), "Approved");
  });

  r.on("POST", "/admin/pro-trials/cancel", async ({ req }) => {
    await requireInternal(req);
    const sub = str((await readJson(req)).sub, "sub", { required: true });
    const { data: app } = await db().from("pro_trial_applications").select("expires_at").eq("user_id", sub).maybeSingle();
    await db().from("pro_trial_applications").update({ status: "cancelled" }).eq("user_id", sub);
    // Take back trial Pro only if that's where the learner's Pro came from.
    if (app?.expires_at) {
      const { data: prof } = await db().from("profiles").select("premium_until").eq("id", sub).maybeSingle();
      if (prof?.premium_until && new Date(prof.premium_until as string).getTime() <= new Date(app.expires_at as string).getTime()) {
        await db().from("profiles").update({ premium_until: new Date().toISOString() }).eq("id", sub);
      }
    }
    return ok(await trialList(), "Cancelled");
  });

  r.on("PUT", "/admin/pro-trials/settings", async ({ req }) => {
    const { by } = await requireInternal(req);
    await putSettings("pro_trial", (await readJson(req)) as never, by);
    return ok(await trialList(), "Saved");
  });

  // Pro invite link
  r.on("GET", "/admin/pro-invite", async ({ req }) => {
    await requireInternal(req);
    return ok(await inviteResponse());
  });

  r.on("PUT", "/admin/pro-invite/settings", async ({ req }) => {
    const { by } = await requireInternal(req);
    const next = validateSettings("pro_invite", (await readJson(req)) as never);
    const realEnd = inviteEffectiveEndsOn(next, await getSettings("pro_trial"));
    if (next.showEndsOn && realEnd && next.showEndsOn > realEnd) {
      throw fail.badRequest("The date shown on /pro can't be later than the real end date.");
    }
    await putSettings("pro_invite", next, by);
    return ok(await inviteResponse(), "Saved");
  });
}
