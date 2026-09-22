"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addBadgeAction,
  bulkUpsertBadgesAction,
  setBadgeActiveAction,
  refreshBadgeCatalogAction,
  type Badge,
} from "./actions";
import AdminTabs, { type AdminMode } from "../AdminTabs";
import JsonBulkEditor from "../JsonBulkEditor";
import { BadgeArt } from "@/components/badges/BadgeArt";
import { comboGameLabel, parseBadgeId, type ComboGame } from "@/lib/badges";

// Fixed allow-list — mirrors the backend (badgeid.go). `lvl` is auto-awarded
// per level and intentionally absent here; the levels admin manages levels.
const CATEGORIES = ["xp", "streak", "combo", "progset", "onboarding"] as const;
const COMBO_GAMES: ComboGame[] = ["jumble", "pronunciation", "ai-partner"];

type Category = (typeof CATEGORIES)[number];

export default function BadgesAdminClient({
  initialByCategory,
}: {
  initialByCategory: Record<string, Badge[]>;
}) {
  const [byCategory, setByCategory] = useState(initialByCategory);
  const [mode, setMode] = useState<AdminMode>("ui");

  async function refresh() {
    const res = await fetch("/v3/admin/badges/api/list", { cache: "no-store" });
    if (!res.ok) return;
    setByCategory((await res.json()) as Record<string, Badge[]>);
  }

  const flatBadges = Object.values(byCategory)
    .flat()
    .slice()
    .sort((a, b) => (a.category === b.category ? a.threshold - b.threshold : a.category.localeCompare(b.category)));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <RefreshButton />
        <AdminTabs mode={mode} onChange={setMode} />
      </div>

      {mode === "ui" ? (
        <>
          <AddBadgeForm onAdded={refresh} />
          {CATEGORIES.map((cat) => (
            <CategorySection
              key={cat}
              category={cat}
              badges={(byCategory[cat] ?? []).slice().sort((a, b) => a.threshold - b.threshold)}
              onChanged={refresh}
            />
          ))}
        </>
      ) : (
        <JsonBulkEditor
          // New contract: facts only. category (+ game for combo) + threshold.
          initial={flatBadges.map((b) => ({
            category: b.category,
            ...(b.category === "combo" && b.game ? { game: b.game } : {}),
            threshold: b.threshold,
          }))}
          fieldKey="badges"
          apply={(payload) => bulkUpsertBadgesAction(payload as { badges: unknown[] })}
          onApplied={refresh}
        />
      )}
    </div>
  );
}

function RefreshButton() {
  const [pending, startTransition] = useTransition();
  const [info, setInfo] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="secondary"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              await refreshBadgeCatalogAction();
              setInfo("Backend cache refreshed.");
            } catch (err) {
              setInfo(err instanceof Error ? err.message : "Refresh failed");
            }
          })
        }
      >
        {pending ? "Refreshing…" : "Refresh backend cache"}
      </Button>
      {info && <span className="text-xs text-muted-foreground">{info}</span>}
    </div>
  );
}

function AddBadgeForm({ onAdded }: { onAdded: () => void }) {
  const [category, setCategory] = useState<Category>("xp");
  const [game, setGame] = useState<ComboGame>("jumble");
  const [threshold, setThreshold] = useState("100");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isCombo = category === "combo";
  const isOnboarding = category === "onboarding";
  // Single-event badges: earned once from a fixed trigger, no threshold to
  // pick (the backend pins it to 1). Onboarding = signup only.
  // progset is a cumulative counter (like xp/streak): threshold = total
  // progressive sets completed, so milestones (1, 2, 3, 5, 7, 9, 10) each
  // get their own badge.
  const isSingleEvent = isOnboarding;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const n = isSingleEvent ? 1 : Number(threshold);
    if (!isSingleEvent && (!Number.isInteger(n) || n < 1)) {
      setError("Threshold must be a whole number ≥ 1");
      return;
    }
    startTransition(async () => {
      try {
        await addBadgeAction({
          category,
          threshold: n,
          ...(isCombo ? { game } : {}),
        });
        onAdded();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add");
      }
    });
  }

  // Live preview of the badge the current selection will create.
  const previewId = isCombo
    ? `combo:${game}:${Number(threshold) || 0}`
    : isSingleEvent
      ? `${category}:1`
      : `${category}:${Number(threshold) || 0}`;

  return (
    <form onSubmit={submit} className="c-box grid gap-4 rounded-xl p-5 sm:grid-cols-2">
      <div className="space-y-2">
        <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Category</Label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          className="w-full rounded border bg-surface-1 px-3 py-2 text-sm"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {isCombo ? (
        <div className="space-y-2">
          <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Game</Label>
          <select
            value={game}
            onChange={(e) => setGame(e.target.value as ComboGame)}
            className="w-full rounded border bg-surface-1 px-3 py-2 text-sm"
          >
            {COMBO_GAMES.map((g) => (
              <option key={g} value={g}>
                {comboGameLabel(g)}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="badge-threshold" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Threshold
          </Label>
          <Input
            id="badge-threshold"
            type="number"
            min={1}
            value={isSingleEvent ? "1" : threshold}
            disabled={isSingleEvent}
            onChange={(e) => setThreshold(e.target.value)}
          />
        </div>
      )}

      {/* Combo threshold goes full-width on its own row when game took the slot */}
      {isCombo && (
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="combo-threshold" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Combo count (threshold)
          </Label>
          <Input
            id="combo-threshold"
            type="number"
            min={1}
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
          />
        </div>
      )}

      <div className="flex items-center gap-3 sm:col-span-2">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-white/10">
          <BadgeArt id={previewId} variant="deck" />
        </div>
        <p className="text-xs text-muted-foreground">
          Will create <span className="font-mono text-heading">{previewId}</span>. The visual + title come from the
          frontend badge registry.
          {isOnboarding && " Onboarding is a single badge (threshold pinned to 1) and is awarded silently."}
          {category === "progset" &&
            " Threshold = total progressive sets (easy → medium → hard) the user must complete to earn this badge. Add one per milestone — e.g. 1, 2, 3, 5, 7, 9, 10. A party-popper + bonus XP still fire on every completed set regardless; the bonus amount is configured in Jumble Settings."}
        </p>
      </div>

      {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          <Plus className="h-4 w-4" />
          {pending ? "Adding…" : "Add badge"}
        </Button>
      </div>
    </form>
  );
}

function CategorySection({
  category,
  badges,
  onChanged,
}: {
  category: string;
  badges: Badge[];
  onChanged: () => void;
}) {
  if (badges.length === 0) {
    return (
      <div className="c-box rounded-xl p-5">
        <h3 className="mb-2 text-sm font-semibold capitalize text-heading">{category}</h3>
        <p className="text-sm text-muted-foreground">No badges yet.</p>
      </div>
    );
  }
  return (
    <div className="c-box rounded-xl p-5">
      <h3 className="mb-4 text-sm font-semibold capitalize text-heading">
        {category} ({badges.length})
      </h3>
      <ul className="space-y-2">
        {badges.map((b) => (
          <BadgeRow key={b.id} badge={b} onChanged={onChanged} />
        ))}
      </ul>
    </div>
  );
}

function BadgeRow({ badge, onChanged }: { badge: Badge; onChanged: () => void }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const parsed = parseBadgeId(badge.id);

  function toggleActive() {
    setError(null);
    startTransition(async () => {
      const res = await setBadgeActiveAction(badge.id, !badge.active);
      if (!res.ok) {
        setError(res.error ?? "Failed to update");
        return;
      }
      onChanged();
    });
  }

  return (
    <li
      className={`flex items-center gap-3 rounded-lg border border-white/[0.06] bg-surface-2/40 p-3 ${
        !badge.active ? "opacity-50" : ""
      }`}
    >
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10">
        <BadgeArt id={badge.id} variant="deck" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-heading">
          {parsed.category === "onboarding"
            ? "Onboarding"
            : parsed.category === "combo"
              ? `${comboGameLabel(parsed.game)} combo ≥ ${badge.threshold}`
              : `${parsed.category} ≥ ${badge.threshold}`}
        </p>
        <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground/60">id: {badge.id}</p>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
      <button
        type="button"
        onClick={toggleActive}
        disabled={pending}
        className="text-xs font-semibold underline disabled:opacity-50"
      >
        {badge.active ? "Deactivate" : "Activate"}
      </button>
    </li>
  );
}
