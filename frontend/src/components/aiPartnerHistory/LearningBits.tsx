import { useId, useState } from "react";
import { Check, X } from "lucide-react";

import { cn } from "@/lib/utils";

import { chip, focusable } from "./styles";

// Corrections ("✗ wrong → ✓ correct") and new-word chips. Used by the chat
// detail (one conversation's digest) and by the memory tab (what K.AI has
// noted across conversations).

export type Correction = { wrong: string; correct: string; why?: string; count?: number };

export function CorrectionList({ items }: { items: Correction[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((m, i) => (
        <li key={`${m.wrong}-${i}`} className="rounded-xl border border-border bg-surface-1 p-3.5">
          <p className="flex items-start gap-2 text-sm leading-6">
            <X className="mt-1 h-4 w-4 shrink-0 text-destructive" aria-hidden />
            <span className="sr-only">You said: </span>
            <span className="min-w-0 break-words text-destructive line-through decoration-destructive/40">
              {m.wrong}
            </span>
            {typeof m.count === "number" && m.count > 1 && (
              <span className="ml-auto shrink-0 rounded-full bg-surface-3 px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                ×{m.count}
              </span>
            )}
          </p>
          <p className="mt-1 flex items-start gap-2 text-sm leading-6">
            <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
            <span className="sr-only">Better: </span>
            <span className="min-w-0 break-words font-semibold text-emerald-700 dark:text-emerald-400">{m.correct}</span>
          </p>
          {m.why && <p className="mt-1.5 pl-6 text-xs leading-5 text-muted-foreground">{m.why}</p>}
        </li>
      ))}
    </ul>
  );
}

// Word chips that reveal their meaning in one shared panel below. A tap (or
// Enter/Space) pins a word; a mouse hover previews one. Nothing is hover-only,
// so it works the same on phones and with a keyboard or screen reader.
export function VocabChips({ items }: { items: { word: string; meaning?: string }[] }) {
  const panelId = useId();
  const [selected, setSelected] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const withMeaning = items.some((v) => v.meaning?.trim());
  const shown = hovered ?? selected;
  const shownItem = shown !== null ? items[shown] : undefined;

  if (!withMeaning) {
    return (
      <ul className="flex flex-wrap gap-2">
        {items.map((v, i) => (
          <li key={`${v.word}-${i}`} className={chip}>
            {v.word}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div>
      <ul className="flex flex-wrap gap-2">
        {items.map((v, i) => {
          const active = selected === i;
          return (
            <li key={`${v.word}-${i}`}>
              <button
                type="button"
                aria-expanded={active}
                aria-controls={panelId}
                onClick={() => setSelected(active ? null : i)}
                onPointerEnter={(e) => {
                  if (e.pointerType === "mouse") setHovered(i);
                }}
                onPointerLeave={(e) => {
                  if (e.pointerType === "mouse") setHovered(null);
                }}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold transition-colors",
                  focusable,
                  active
                    ? "border-primary/50 bg-primary/12 text-heading"
                    : "border-border bg-surface-1 text-heading hover:border-primary/35 hover:bg-surface-3",
                )}
              >
                {v.word}
              </button>
            </li>
          );
        })}
      </ul>
      <div
        id={panelId}
        aria-live="polite"
        className="mt-3 min-h-[3.25rem] rounded-xl border border-dashed border-border px-3.5 py-2.5 text-sm leading-6"
      >
        {shownItem ? (
          <p>
            <span className="font-bold text-heading">{shownItem.word}</span>
            <span className="text-muted-foreground"> — </span>
            <span className="text-body">{shownItem.meaning?.trim() || "No meaning saved for this word."}</span>
          </p>
        ) : (
          <p className="text-muted-foreground">Tap a word to see what it means.</p>
        )}
      </div>
    </div>
  );
}
