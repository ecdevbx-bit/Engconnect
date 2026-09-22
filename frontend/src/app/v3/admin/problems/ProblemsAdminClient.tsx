"use client";

import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addProblemAction,
  bulkUpsertProblemsAction,
  reorderProblemAction,
  setProblemActiveAction,
  sortKey,
  progressiveSortKey,
  type Problem,
} from "./actions";
import AdminTabs, { type AdminMode } from "../AdminTabs";
import JsonBulkEditor from "../JsonBulkEditor";

// Client wrapper around the four server actions. Keeps the UI minimal —
// list grouped by difficulty, an add form per category, up/down arrows
// for reorder (swap with the neighbour), and a toggle for active.

// "progressive" rows are keyed by base + variant: a base question with
// escalating variants (#1, #2, #3, …). Reorder doesn't apply there — order
// is derived from (base, variant).
const DIFFICULTIES = ["easy", "medium", "hard", "progressive"] as const;

const isProgressive = (d: string) => d === "progressive";

export default function ProblemsAdminClient({
  initialByCategory,
  categories,
}: {
  initialByCategory: Record<string, Problem[]>;
  categories: string[];
}) {
  const [byCategory, setByCategory] = useState(initialByCategory);
  const [activeCategory, setActiveCategory] = useState(categories[0] ?? "jumble");
  const [mode, setMode] = useState<AdminMode>("ui");

  // Refresh a single category from the server (after a mutation).
  async function refresh(cat: string) {
    const res = await fetch(`/v3/admin/problems/api/list?category=${encodeURIComponent(cat)}`, {
      cache: "no-store",
    });
    if (!res.ok) return;
    const data = (await res.json()) as Problem[];
    setByCategory((prev) => ({ ...prev, [cat]: data }));
  }

  const problemsForCategory = byCategory[activeCategory] ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                activeCategory === c
                  ? "bg-primary text-[#0b0e14]"
                  : "border border-white/[0.06] bg-surface-2/60 text-muted-foreground hover:text-heading"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <AdminTabs mode={mode} onChange={setMode} />
      </div>

      {mode === "ui" ? (
        <CategorySection
          category={activeCategory}
          problems={problemsForCategory}
          onChanged={() => refresh(activeCategory)}
        />
      ) : (
        <JsonBulkEditor
          // Strip the `category` field from each item — it's implied by
          // the active tab and the server still validates it on apply.
          // Keeping it visible would just be noise.
          initial={problemsForCategory.map((p) =>
            isProgressive(p.difficulty)
              ? {
                  category: p.category,
                  difficulty: p.difficulty,
                  base: p.base,
                  variant: p.variant,
                  initial: p.initial,
                  final: p.final,
                  active: p.active,
                }
              : {
                  category: p.category,
                  difficulty: p.difficulty,
                  order: p.order,
                  initial: p.initial,
                  final: p.final,
                  active: p.active,
                },
          )}
          fieldKey="problems"
          apply={(payload) =>
            bulkUpsertProblemsAction(payload as { problems: unknown[] })
          }
          onApplied={() => refresh(activeCategory)}
        />
      )}
    </div>
  );
}

function CategorySection({
  category,
  problems,
  onChanged,
}: {
  category: string;
  problems: Problem[];
  onChanged: () => void;
}) {
  // Progressive is jumble-only and authored as base + variants, so it gets a
  // dedicated builder + grouped view rather than the flat difficulty table.
  const showProgressive = category === "jumble";
  return (
    <div className="space-y-8">
      <AddProblemForm category={category} onAdded={onChanged} />
      {DIFFICULTIES.filter((d) => !isProgressive(d)).map((d) => (
        <DifficultyTable
          key={d}
          category={category}
          difficulty={d}
          problems={problems.filter((p) => p.difficulty === d).sort((a, b) => a.order - b.order)}
          onChanged={onChanged}
        />
      ))}
      {showProgressive && (
        <>
          <ProgressiveBuilder
            category={category}
            existing={problems.filter((p) => isProgressive(p.difficulty))}
            onAdded={onChanged}
          />
          <ProgressiveSection
            category={category}
            problems={problems.filter((p) => isProgressive(p.difficulty))}
            onChanged={onChanged}
          />
        </>
      )}
    </div>
  );
}

// AddProblemForm handles the fixed bands (easy/medium/hard) and pronunciation.
// Progressive is authored separately via ProgressiveBuilder, so it's excluded
// from this form's difficulty dropdown.
const ADD_DIFFICULTIES = DIFFICULTIES.filter((d) => !isProgressive(d));

function AddProblemForm({ category, onAdded }: { category: string; onAdded: () => void }) {
  const [difficulty, setDifficulty] = useState<(typeof ADD_DIFFICULTIES)[number]>("easy");
  const [initial, setInitial] = useState("");
  const [final, setFinal] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Pronunciation rows don't have a separate "scrambled" prompt — the
  // sentence itself is the only text. Hide the Initial field for that
  // category and adapt the grid + button validation accordingly.
  const isPronunciation = category === "pronunciation";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await addProblemAction({
          category,
          difficulty,
          initial: isPronunciation ? "" : initial.trim(),
          final: final.trim(),
        });
        setInitial("");
        setFinal("");
        onAdded();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add");
      }
    });
  }

  const gridCols = isPronunciation
    ? "sm:grid-cols-[140px_1fr_auto]"
    : "sm:grid-cols-[140px_1fr_1fr_auto]";

  return (
    <form
      onSubmit={submit}
      className={`c-box rounded-xl p-5 grid gap-4 ${gridCols} sm:items-end`}
    >
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
          Difficulty
        </Label>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as (typeof ADD_DIFFICULTIES)[number])}
          className="w-full rounded border bg-surface-1 px-3 py-2 text-sm"
        >
          {ADD_DIFFICULTIES.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>
      {!isPronunciation && (
        <div className="space-y-2">
          <Label htmlFor="problem-initial" className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
            Initial (jumbled)
          </Label>
          <Input id="problem-initial" value={initial} onChange={(e) => setInitial(e.target.value)} placeholder="dog the brown jumped" />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="problem-final" className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
          {isPronunciation ? "Sentence" : "Final (correct)"}
        </Label>
        <Input
          id="problem-final"
          value={final}
          onChange={(e) => setFinal(e.target.value)}
          placeholder={isPronunciation ? "She drinks tea every morning" : "the brown dog jumped"}
        />
      </div>
      <Button type="submit" disabled={pending || !final.trim() || (!isPronunciation && !initial.trim())}>
        <Plus className="h-4 w-4" /> {pending ? "Adding…" : "Add"}
      </Button>
      {error && <p className="col-span-full text-sm text-red-600">{error}</p>}
    </form>
  );
}

// ── Progressive band ────────────────────────────────────────────────────────
// A progressive "question" is a base with several escalating variants (#1, #2,
// #3, …), keyed progressive#<base>#<variant>. The builder authors a base and
// all its variants in one go (bulk upsert); the section below lists them
// grouped by base, mirroring the SK structure.

type VariantDraft = { initial: string; final: string };

function ProgressiveBuilder({
  category,
  existing,
  onAdded,
}: {
  category: string;
  existing: Problem[];
  onAdded: () => void;
}) {
  const nextBase = existing.reduce((m, p) => Math.max(m, p.base ?? 0), 0) + 1;
  const [base, setBase] = useState(String(nextBase));
  const [variants, setVariants] = useState<VariantDraft[]>([
    { initial: "", final: "" },
    { initial: "", final: "" },
    { initial: "", final: "" },
  ]);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const baseN = Number(base);
  // Each row must be all-or-nothing (both initial + final, or neither).
  const rowsBalanced = variants.every(
    (v) => (v.initial.trim() === "") === (v.final.trim() === ""),
  );
  const filledCount = variants.filter((v) => v.initial.trim() && v.final.trim()).length;
  const valid = Number.isInteger(baseN) && baseN >= 1 && rowsBalanced && filledCount >= 1;

  function setVariant(i: number, partial: Partial<VariantDraft>) {
    setVariants((prev) => prev.map((v, idx) => (idx === i ? { ...v, ...partial } : v)));
  }
  function addVariant() {
    setVariants((prev) => [...prev, { initial: "", final: "" }]);
  }
  function removeVariant(i: number) {
    setVariants((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i)));
  }

  function reset(nextBaseValue: number) {
    setBase(String(nextBaseValue));
    setVariants([
      { initial: "", final: "" },
      { initial: "", final: "" },
      { initial: "", final: "" },
    ]);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    // Variant number = row position (1-based) so it reads as the escalation
    // level #1 → #2 → #3. Empty rows are skipped.
    const problems = variants
      .map((v, idx) => ({ v, variant: idx + 1 }))
      .filter(({ v }) => v.initial.trim() && v.final.trim())
      .map(({ v, variant }) => ({
        category,
        difficulty: "progressive",
        base: baseN,
        variant,
        initial: v.initial.trim(),
        final: v.final.trim(),
        active: true,
      }));
    if (problems.length === 0) {
      setError("Add at least one variant (both jumbled + correct text).");
      return;
    }
    startTransition(async () => {
      const res = await bulkUpsertProblemsAction({ problems });
      const failed = res.results.filter((r) => r.status === "failed");
      if (failed.length > 0) {
        setError(failed.map((f) => `variant #${f.index + 1}: ${f.error ?? "failed"}`).join("; "));
        return;
      }
      setInfo(`Saved base ${baseN} with ${problems.length} variant${problems.length === 1 ? "" : "s"}.`);
      reset(baseN + 1);
      onAdded();
    });
  }

  return (
    <form onSubmit={submit} className="c-box rounded-xl p-5 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-heading">
            New progressive question
          </h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-md">
            One base question with escalating variants (#1, #2, #3, …). Each variant becomes
            <span className="font-mono"> progressive#{String(baseN || 0).padStart(5, "0")}#N</span>.
          </p>
        </div>
        <div className="space-y-1">
          <Label htmlFor="prog-base" className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Base #
          </Label>
          <Input
            id="prog-base"
            type="number"
            min={1}
            value={base}
            onChange={(e) => setBase(e.target.value)}
            className="w-24"
          />
        </div>
      </div>

      <div className="space-y-3">
        {variants.map((v, i) => (
          <div key={i} className="grid gap-3 sm:grid-cols-[40px_1fr_1fr_auto] sm:items-end">
            <span className="hidden sm:flex h-9 items-center justify-center rounded bg-surface-1 text-xs font-mono text-muted-foreground">
              #{i + 1}
            </span>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground sm:hidden">
                #{i + 1} — Initial (jumbled)
              </Label>
              <Input
                value={v.initial}
                onChange={(e) => setVariant(i, { initial: e.target.value })}
                placeholder={i === 0 ? "dog the barks" : "me at dog the barks"}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground sm:hidden">
                #{i + 1} — Final (correct)
              </Label>
              <Input
                value={v.final}
                onChange={(e) => setVariant(i, { final: e.target.value })}
                placeholder={i === 0 ? "the dog barks" : "the dog barks at me"}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeVariant(i)}
              disabled={variants.length <= 1}
              title="Remove variant"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="secondary" size="sm" onClick={addVariant}>
          <Plus className="h-4 w-4" /> Add variant
        </Button>
        <Button type="submit" disabled={pending || !valid}>
          {pending ? "Saving…" : "Create question"}
        </Button>
        {info && <span className="text-sm text-green-400">{info}</span>}
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>
    </form>
  );
}

function ProgressiveSection({
  category,
  problems,
  onChanged,
}: {
  category: string;
  problems: Problem[];
  onChanged: () => void;
}) {
  // Group variants under their base, both sorted ascending.
  const byBase = new Map<number, Problem[]>();
  for (const p of problems) {
    const b = p.base ?? 0;
    const list = byBase.get(b) ?? [];
    list.push(p);
    byBase.set(b, list);
  }
  const bases = [...byBase.keys()].sort((a, b) => a - b);

  if (bases.length === 0) {
    return (
      <div className="c-box rounded-xl p-5">
        <h3 className="text-sm font-semibold text-heading capitalize mb-2">progressive</h3>
        <p className="text-sm text-muted-foreground">No progressive questions yet.</p>
      </div>
    );
  }

  return (
    <div className="c-box rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-heading">
        progressive — {problems.length} variants across {bases.length} questions
      </h3>
      {bases.map((b) => {
        const variants = (byBase.get(b) ?? []).sort((x, y) => (x.variant ?? 0) - (y.variant ?? 0));
        return (
          <div key={b} className="rounded-lg border border-white/[0.06] bg-surface-2/30 p-3">
            <p className="mb-2 text-xs font-mono text-muted-foreground">base {b}</p>
            <ul className="space-y-2">
              {variants.map((p) => (
                <ProgressiveVariantRow
                  key={p.variant}
                  problem={p}
                  category={category}
                  onChanged={onChanged}
                />
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function ProgressiveVariantRow({
  problem,
  category,
  onChanged,
}: {
  problem: Problem;
  category: string;
  onChanged: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function toggleActive() {
    setError(null);
    const sk = await progressiveSortKey(problem.base ?? 0, problem.variant ?? 0);
    startTransition(async () => {
      try {
        await setProblemActiveAction(category, sk, !problem.active);
        onChanged();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update");
      }
    });
  }

  return (
    <li className={`flex items-start gap-3 rounded-lg border border-white/[0.06] bg-surface-2/40 p-3 ${!problem.active ? "opacity-50" : ""}`}>
      <span className="rounded bg-surface-1 px-2 py-1 text-xs font-mono text-muted-foreground whitespace-nowrap">
        #{problem.variant}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-heading truncate">{problem.final}</p>
        {problem.initial && (
          <p className="text-xs text-muted-foreground truncate">jumbled: {problem.initial}</p>
        )}
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={toggleActive}
        className="text-xs font-semibold underline disabled:opacity-50"
      >
        {problem.active ? "Deactivate" : "Activate"}
      </button>
    </li>
  );
}

function DifficultyTable({
  category,
  difficulty,
  problems,
  onChanged,
}: {
  category: string;
  difficulty: string;
  problems: Problem[];
  onChanged: () => void;
}) {
  if (problems.length === 0) {
    return (
      <div className="c-box rounded-xl p-5">
        <h3 className="text-sm font-semibold text-heading capitalize mb-2">{difficulty}</h3>
        <p className="text-sm text-muted-foreground">No problems yet.</p>
      </div>
    );
  }
  return (
    <div className="c-box rounded-xl p-5">
      <h3 className="text-sm font-semibold text-heading capitalize mb-4">{difficulty} ({problems.length})</h3>
      <ul className="space-y-2">
        {problems.map((p, i) => (
          <ProblemRow
            key={isProgressive(p.difficulty) ? `prog-${p.base}-${p.variant}` : `${p.difficulty}-${p.order}`}
            problem={p}
            canMoveUp={i > 0}
            canMoveDown={i < problems.length - 1}
            prevOrder={problems[i - 1]?.order}
            nextOrder={problems[i + 1]?.order}
            category={category}
            onChanged={onChanged}
          />
        ))}
      </ul>
    </div>
  );
}

function ProblemRow({
  problem,
  canMoveUp,
  canMoveDown,
  prevOrder,
  nextOrder,
  category,
  onChanged,
}: {
  problem: Problem;
  canMoveUp: boolean;
  canMoveDown: boolean;
  prevOrder?: number;
  nextOrder?: number;
  category: string;
  onChanged: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function moveTo(newOrder: number) {
    setError(null);
    const sk = isProgressive(problem.difficulty)
      ? await progressiveSortKey(problem.base ?? 0, problem.variant ?? 0)
      : await sortKey(problem.difficulty, problem.order);
    startTransition(async () => {
      try {
        await reorderProblemAction(category, sk, newOrder);
        onChanged();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to reorder");
      }
    });
  }

  async function toggleActive() {
    setError(null);
    const sk = isProgressive(problem.difficulty)
      ? await progressiveSortKey(problem.base ?? 0, problem.variant ?? 0)
      : await sortKey(problem.difficulty, problem.order);
    startTransition(async () => {
      try {
        await setProblemActiveAction(category, sk, !problem.active);
        onChanged();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update");
      }
    });
  }

  return (
    <li className={`flex items-start gap-3 rounded-lg border border-white/[0.06] bg-surface-2/40 p-3 ${!problem.active ? "opacity-50" : ""}`}>
      <span className="rounded bg-surface-1 px-2 py-1 text-xs font-mono text-muted-foreground whitespace-nowrap">
        {isProgressive(problem.difficulty)
          ? `base ${problem.base ?? "?"} · #${problem.variant ?? "?"}`
          : `#${problem.order}`}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-heading truncate">{problem.final}</p>
        {category !== "pronunciation" && problem.initial && (
          <p className="text-xs text-muted-foreground truncate">jumbled: {problem.initial}</p>
        )}
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
      <div className="flex items-center gap-1">
        {/* Reorder doesn't apply to progressive — its order is derived from
            (base, variant). Hide the arrows for that band. */}
        {!isProgressive(problem.difficulty) && (
          <>
            <button
              type="button"
              disabled={!canMoveUp || pending || prevOrder === undefined}
              onClick={() => prevOrder !== undefined && moveTo(prevOrder)}
              title="Move up"
              className="p-1.5 rounded hover:bg-surface-1 disabled:opacity-30"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={!canMoveDown || pending || nextOrder === undefined}
              onClick={() => nextOrder !== undefined && moveTo(nextOrder)}
              title="Move down"
              className="p-1.5 rounded hover:bg-surface-1 disabled:opacity-30"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          </>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={toggleActive}
          className="ml-2 text-xs font-semibold underline disabled:opacity-50"
        >
          {problem.active ? "Deactivate" : "Activate"}
        </button>
      </div>
    </li>
  );
}
