"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Plus, Trash2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LEVEL_ICON_NAMES, iconForName } from "@/lib/levels";
import { saveLevelsAction, type AdminLevel } from "./actions";
import AdminTabs, { type AdminMode } from "../AdminTabs";
import JsonDocEditor from "../JsonDocEditor";

// generateThresholds builds an arithmetic-progression XP ladder.
//
//   gap_k    = baseGap + (k-1) * increment      // gap between level k and k+1
//   level_1  = 0
//   level_n  = sum of gap_1 .. gap_{n-1}
//
// Examples (count=10):
//   baseGap=100, increment=0   →  0, 100, 200, 300, …, 900
//   baseGap=100, increment=50  →  0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700
//   baseGap=250, increment=100 →  0, 250, 600, 1050, 1600, 2250, 3000, 3850, 4800, 5850
//
// Returns just the thresholds (one per level); the caller merges them
// into existing rows so titles / icons stay intact.
function generateThresholds(count: number, baseGap: number, increment: number): number[] {
  if (count <= 0) return [];
  const out: number[] = [0];
  let runningGap = baseGap;
  for (let i = 1; i < count; i++) {
    out.push(out[i - 1] + Math.max(1, Math.round(runningGap)));
    runningGap += increment;
  }
  return out;
}

// Levels admin editor.
//
// Editing UX:
//   - Rows are ordered; level number is the row position (1..N) and
//     can't be edited directly. Threshold, title, and icon are.
//   - "Add level at end" appends a new row with the next round number
//     of XP (last threshold + 100) — admin can tune from there.
//   - "Remove last" deletes the bottom row. We don't allow removing
//     middle rows — that would renumber every level below and surprise
//     anyone currently sitting on one of them.
//   - Save submits the whole list (PUT replaces). Validation errors
//     from the backend surface as a single banner.

export default function LevelsAdminClient({ initial }: { initial: AdminLevel[] }) {
  const seed = initial.length > 0 ? initial : [{ level: 1, threshold: 0, title: "Hello World", icon: "Sparkles" }];
  const [rows, setRows] = useState<AdminLevel[]>(seed);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [mode, setMode] = useState<AdminMode>("ui");

  // Auto-generate inputs. Defaults match the built-in DefaultLevels
  // curve roughly (100 base, ~50 increment per step).
  const [baseGap, setBaseGap] = useState(100);
  const [increment, setIncrement] = useState(50);

  // Live preview — pure derivation from the inputs and the current
  // row count. Showing it before the admin applies makes it obvious
  // what'll happen.
  const previewThresholds = useMemo(
    () => generateThresholds(rows.length, baseGap, increment),
    [rows.length, baseGap, increment],
  );

  function applyFormula() {
    const thresholds = generateThresholds(rows.length, baseGap, increment);
    setRows((prev) =>
      prev.map((r, i) => ({
        ...r,
        threshold: thresholds[i] ?? r.threshold,
      })),
    );
  }

  // Keep level numbers in sync with row order so the admin doesn't have
  // to think about them. The backend re-numbers on save anyway.
  useEffect(() => {
    setRows((prev) => prev.map((r, i) => ({ ...r, level: i + 1 })));
    // No deps — runs once on mount to canonicalise the initial payload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function patch(idx: number, partial: Partial<AdminLevel>) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...partial } : r)));
  }

  function addAtEnd() {
    setRows((prev) => {
      const last = prev[prev.length - 1];
      const nextThreshold = (last?.threshold ?? 0) + 100;
      return [
        ...prev,
        {
          level: prev.length + 1,
          threshold: nextThreshold,
          title: `Level ${prev.length + 1}`,
          icon: "Star",
        },
      ];
    });
  }

  function removeLast() {
    setRows((prev) => (prev.length <= 1 ? prev : prev.slice(0, -1)));
  }

  function onSave() {
    setError(null);
    setInfo(null);
    // Client-side sanity — backend re-validates and is the real gate.
    for (let i = 0; i < rows.length; i++) {
      if (!rows[i].title.trim()) {
        setError(`Row ${i + 1}: title required.`);
        return;
      }
      if (rows[i].threshold < 0) {
        setError(`Row ${i + 1}: threshold can't be negative.`);
        return;
      }
      if (i === 0 && rows[i].threshold !== 0) {
        setError("Row 1's threshold must be 0.");
        return;
      }
      if (i > 0 && rows[i].threshold <= rows[i - 1].threshold) {
        setError(`Row ${i + 1}: threshold must be greater than row ${i}'s.`);
        return;
      }
    }
    startTransition(async () => {
      const res = await saveLevelsAction(rows);
      if (!res.ok) {
        setError(res.message ?? "Save failed");
        return;
      }
      if (res.data) setRows(res.data);
      setInfo("Saved.");
    });
  }

  if (mode === "json") {
    return (
      <div className="space-y-5">
        <div className="flex justify-end">
          <AdminTabs mode={mode} onChange={setMode} />
        </div>
        <JsonDocEditor<AdminLevel[]>
          initial={rows}
          hint='Array of levels: [{ "level", "threshold", "title", "icon" }]. Saved as a whole-list replace; the backend re-numbers levels by position.'
          apply={async (parsed) => {
            const res = await saveLevelsAction(parsed);
            if (res.ok && res.data) setRows(res.data);
            return { ok: res.ok, message: res.message };
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <AdminTabs mode={mode} onChange={setMode} />
      </div>
      {/* Auto-generator. Lets admins skip typing every threshold —
          enter a base gap and (optionally) an increment, hit Apply,
          fine-tune from there. */}
      <div className="c-box rounded-2xl p-5 space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-heading">
              Generate thresholds
            </h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-md">
              Base gap = XP between Lv1 and Lv2. Increment = how much that gap grows each
              level after. Use increment = 0 for a flat staircase.
            </p>
          </div>
          <Button onClick={applyFormula} disabled={pending} variant="secondary" size="sm">
            <Wand2 className="h-4 w-4" /> Apply to {rows.length} rows
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Base gap (Lv1 → Lv2)
            </Label>
            <Input
              type="number"
              min={1}
              value={baseGap}
              onChange={(e) => setBaseGap(Math.max(1, Number(e.target.value) || 1))}
              disabled={pending}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Increment per level
            </Label>
            <Input
              type="number"
              min={0}
              value={increment}
              onChange={(e) => setIncrement(Math.max(0, Number(e.target.value) || 0))}
              disabled={pending}
            />
          </div>
        </div>

        <div className="rounded-xl bg-surface-2/40 p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
            Preview ({rows.length} levels)
          </p>
          <p className="text-xs font-mono text-body break-words">
            {previewThresholds.map((t) => t.toLocaleString()).join(" → ")}
          </p>
        </div>
      </div>

      <div className="c-box rounded-2xl p-5 space-y-2">
        {rows.map((row, i) => (
          <LevelRowEditor
            key={i}
            row={row}
            index={i}
            onChange={(partial) => patch(i, partial)}
            disabled={pending}
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={addAtEnd} disabled={pending}>
            <Plus className="h-4 w-4" /> Add level
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={removeLast}
            disabled={pending || rows.length <= 1}
          >
            <Trash2 className="h-4 w-4" /> Remove last
          </Button>
        </div>
        <Button onClick={onSave} disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
      {info && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
          {info}
        </div>
      )}
    </div>
  );
}

function LevelRowEditor({
  row,
  index,
  onChange,
  disabled,
}: {
  row: AdminLevel;
  index: number;
  onChange: (partial: Partial<AdminLevel>) => void;
  disabled?: boolean;
}) {
  const Icon = iconForName(row.icon);
  return (
    <div className="grid grid-cols-[60px_60px_1fr_180px] items-center gap-3 rounded-xl bg-surface-2/40 p-3">
      <span className="rounded bg-surface-1 px-2 py-1 text-xs font-mono text-center text-muted-foreground">
        Lv {index + 1}
      </span>
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary mx-auto">
        <Icon className="h-4 w-4" />
      </span>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground w-16 shrink-0">
            Title
          </Label>
          <Input
            value={row.title}
            onChange={(e) => onChange({ title: e.target.value })}
            disabled={disabled}
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground w-16 shrink-0">
            XP
          </Label>
          <Input
            type="number"
            min={0}
            value={row.threshold}
            onChange={(e) => onChange({ threshold: Number(e.target.value) })}
            disabled={disabled}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground w-12 shrink-0">
          Icon
        </Label>
        <select
          value={row.icon}
          onChange={(e) => onChange({ icon: e.target.value })}
          disabled={disabled}
          className="w-full rounded border bg-surface-1 px-3 py-2 text-sm"
        >
          {LEVEL_ICON_NAMES.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
