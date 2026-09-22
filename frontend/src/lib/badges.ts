// Badge registry support: the contract that links a backend badge ID to the
// frontend's custom visual + celebration. The backend sends pure IDs (see
// docs/badges.md); everything visual/textual lives here on the client.
//
// ID scheme: "<category>[:<game>]:<value>"
//   xp:1000   lvl:3   streak:7   combo:jumble:10   onboarding:1

export type BadgeCategory =
  | "xp"
  | "lvl"
  | "streak"
  | "combo"
  | "progset"
  | "onboarding"
  | "unknown";

export type ComboGame = "jumble" | "pronunciation" | "ai-partner";

export interface ParsedBadge {
  id: string;
  category: BadgeCategory;
  game?: ComboGame; // combo only
  value: number; // threshold / level number (1 for onboarding)
}

export function parseBadgeId(id: string): ParsedBadge {
  const parts = (id ?? "").split(":");
  switch (parts[0]) {
    case "xp":
    case "lvl":
    case "streak":
    case "progset":
      return { id, category: parts[0], value: Number(parts[1]) || 0 };
    case "combo":
      return {
        id,
        category: "combo",
        game: (parts[1] as ComboGame) || undefined,
        value: Number(parts[2]) || 0,
      };
    case "onboarding":
      return { id, category: "onboarding", value: 1 };
    default:
      return { id, category: "unknown", value: 0 };
  }
}

const GAME_LABEL: Record<ComboGame, string> = {
  jumble: "Jumble",
  pronunciation: "Pronunciation",
  "ai-partner": "AI Partner",
};

export function comboGameLabel(game?: ComboGame): string {
  return game ? GAME_LABEL[game] : "Combo";
}

// Custom titles — mostly meaningful for the level cards (the rest are derived
// from the value). Extend this map to give a specific badge a bespoke name.
const LEVEL_TITLES: Record<number, string> = {
  1: "First Steps",
  2: "Getting Started",
  3: "Finding Your Voice",
  4: "On a Roll",
  5: "Confident Speaker",
  6: "Word Wizard",
  7: "Fluent Mind",
  8: "Language Pro",
  9: "Master Linguist",
  10: "English Legend",
};

export function badgeTitle(id: string): string {
  const b = parseBadgeId(id);
  switch (b.category) {
    case "xp":
      return `${b.value.toLocaleString()} XP`;
    case "lvl":
      return LEVEL_TITLES[b.value] ?? `Level ${b.value}`;
    case "streak":
      return `${b.value}-Day Streak`;
    case "combo":
      return `${comboGameLabel(b.game)} Combo ×${b.value}`;
    case "progset":
      return b.value <= 1 ? "Progressive Set Complete" : `${b.value} Progressive Sets`;
    case "onboarding":
      return "Welcome Aboard";
    default:
      return "Achievement";
  }
}

// A short one-liner shown under the title in the deck / celebration.
export function badgeSubtitle(id: string): string {
  const b = parseBadgeId(id);
  switch (b.category) {
    case "xp":
      return "Experience milestone";
    case "lvl":
      return `Reached level ${b.value}`;
    case "streak":
      return "Kept the daily streak alive";
    case "combo":
      return `${b.value} in a row`;
    case "progset":
      return b.value <= 1
        ? "Cleared easy, medium & hard in one set"
        : `Completed ${b.value} progressive sets`;
    case "onboarding":
      return "You joined English Connection";
    default:
      return id;
  }
}

// accent drives the celebration/deck colour theme per category (and per game
// for combo), so "each badge has a different celebration" without bespoke art.
export interface BadgeAccent {
  from: string;
  to: string;
  ring: string;
  confetti: string[];
}

const COMBO_ACCENTS: Record<ComboGame, BadgeAccent> = {
  jumble: { from: "#8b5cf6", to: "#6366f1", ring: "#a78bfa", confetti: ["#8b5cf6", "#a78bfa", "#c4b5fd"] },
  pronunciation: { from: "#06b6d4", to: "#0ea5e9", ring: "#22d3ee", confetti: ["#06b6d4", "#22d3ee", "#67e8f9"] },
  "ai-partner": { from: "#10b981", to: "#059669", ring: "#34d399", confetti: ["#10b981", "#34d399", "#6ee7b7"] },
};

// AwardMode controls how a freshly-earned badge is surfaced:
//   - celebration: full-screen overlay (the default for milestone badges)
//   - minimal:     a small toast, no screen takeover
//   - silent:      added to the profile with no notification at all
// Backend stays mode-agnostic (it just reports earned IDs); the mode is a pure
// presentation decision and lives here.
export type AwardMode = "silent" | "minimal" | "celebration";

export function awardMode(id: string): AwardMode {
  switch (parseBadgeId(id).category) {
    case "onboarding":
      // Quietly lands in the deck — the user is mid-onboarding, don't interrupt.
      return "silent";
    default:
      // xp / streak / combo earn a full-screen moment. (lvl never flows through
      // the badge channel — the level-up card handles it.)
      return "celebration";
  }
}

// A deck group: one representative badge for a stat family + how many the user
// owns in it. The deck shows the representative with a "×count" overlay.
export interface BadgeGroup {
  id: string; // representative (the highest in the family)
  count: number;
}

// statKey is the family a badge belongs to. Combo is per game (so jumble and
// pronunciation combos stay distinct cards). Level, streak and progset badges
// are per value, so every milestone keeps its own card and an earlier one is
// never overlapped by a newer one. Everything else (xp, onboarding) groups by
// category.
function statKey(b: ParsedBadge): string {
  if (b.category === "combo") return `combo:${b.game ?? ""}`;
  if (b.category === "lvl" || b.category === "streak" || b.category === "progset")
    return `${b.category}:${b.value}`;
  return b.category;
}

const STAT_ORDER: Record<string, number> = { lvl: 0, xp: 1, streak: 2, combo: 3, progset: 4, onboarding: 5, unknown: 6 };

// groupBadgesByStat collapses earned IDs into one card per stat family — the
// representative is the HIGHEST in the family (most impressive), and `count` is
// how many were earned. Ordered by category, then highest value first.
export function groupBadgesByStat(ids: string[]): BadgeGroup[] {
  const groups = new Map<string, { rep: ParsedBadge; count: number }>();
  for (const id of ids) {
    const b = parseBadgeId(id);
    const key = statKey(b);
    const g = groups.get(key);
    if (!g) {
      groups.set(key, { rep: b, count: 1 });
    } else {
      g.count++;
      if (b.value > g.rep.value) g.rep = b;
    }
  }
  return [...groups.values()]
    .sort((a, c) => {
      const oa = STAT_ORDER[a.rep.category] ?? 9;
      const oc = STAT_ORDER[c.rep.category] ?? 9;
      if (oa !== oc) return oa - oc;
      return c.rep.value - a.rep.value;
    })
    .map((g) => ({ id: g.rep.id, count: g.count }));
}

export function badgeAccent(b: ParsedBadge): BadgeAccent {
  switch (b.category) {
    case "xp":
      return { from: "#f59e0b", to: "#f97316", ring: "#fbbf24", confetti: ["#ffd700", "#ffb347", "#ffe082"] };
    case "lvl":
      return { from: "#a855f7", to: "#7c3aed", ring: "#c084fc", confetti: ["#a855f7", "#c084fc", "#e9d5ff"] };
    case "streak":
      return { from: "#ef4444", to: "#f97316", ring: "#fb923c", confetti: ["#ef4444", "#f97316", "#fbbf24"] };
    case "combo":
      return b.game ? COMBO_ACCENTS[b.game] : COMBO_ACCENTS.jumble;
    case "progset":
      // Green → red gradient mirrors the easy → medium → hard journey the
      // badge celebrates; confetti carries all three difficulty colours.
      return { from: "#22c55e", to: "#ef4444", ring: "#f59e0b", confetti: ["#22c55e", "#f59e0b", "#ef4444"] };
    case "onboarding":
      return { from: "#22c55e", to: "#16a34a", ring: "#4ade80", confetti: ["#22c55e", "#4ade80", "#bbf7d0"] };
    default:
      return { from: "#64748b", to: "#475569", ring: "#94a3b8", confetti: ["#cbd5e1", "#94a3b8"] };
  }
}
