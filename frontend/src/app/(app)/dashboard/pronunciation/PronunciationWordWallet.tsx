"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { BookMarked, Check } from "lucide-react";

import { addWord } from "@/lib/wordBank";

// cleanWord lowercases and strips edge punctuation, keeping interior hyphen /
// apostrophe (so "Mother-in-law," → "mother-in-law"). Returns "" when nothing
// usable remains — matching the backend's single-word rule so a drag never
// produces a rejected save.
function cleanWord(raw: string): string {
  const w = raw
    .toLowerCase()
    .replace(/^[^a-z']+/i, "")
    .replace(/[^a-z'-]+$/i, "");
  return /^[a-z][a-z'-]*$/i.test(w) ? w : "";
}

function DraggableWord({ word, saved }: { word: string; saved: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: word,
    disabled: saved,
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;
  return (
    <button
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      disabled={saved}
      className={`touch-none rounded-lg border px-2.5 py-1 text-sm font-semibold transition ${
        saved
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "cursor-grab border-white/[0.14] bg-surface-2/60 text-heading active:cursor-grabbing"
      } ${isDragging ? "opacity-60 shadow-lg" : ""}`}
    >
      {saved ? (
        <span className="inline-flex items-center gap-1">
          <Check className="h-3 w-3" /> {word}
        </span>
      ) : (
        word
      )}
    </button>
  );
}

function Wallet({ active }: { active: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: "wallet" });
  return (
    <div
      ref={setNodeRef}
      className={`flex shrink-0 items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-3 transition ${
        isOver
          ? "border-primary bg-primary/10"
          : active
            ? "border-primary/50"
            : "border-white/[0.14]"
      }`}
    >
      <BookMarked className={`h-5 w-5 ${isOver ? "text-primary" : "text-muted-foreground"}`} />
      <span className="text-sm font-semibold text-heading">
        {isOver ? "Drop to save" : "Word Bank"}
      </span>
    </div>
  );
}

// After a solved attempt, offers the phrase's words as draggable chips; drop a
// chip on the wallet to save it to the Word Bank. Rendered only when the
// word-bank flag is on (the caller gates it).
export function PronunciationWordWallet({
  sentence,
  accessToken,
}: {
  sentence: string;
  accessToken: string;
}) {
  const words = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const tok of sentence.split(/\s+/)) {
      const w = cleanWord(tok);
      if (w && !seen.has(w)) {
        seen.add(w);
        out.push(w);
      }
    }
    return out;
  }, [sentence]);

  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [dragging, setDragging] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const onDragEnd = (e: DragEndEvent) => {
    setDragging(false);
    const word = String(e.active.id);
    if (e.over?.id !== "wallet" || saved[word]) return;
    setSaved((s) => ({ ...s, [word]: true })); // optimistic
    addWord(accessToken, word, "pronunciation").catch(() => {
      setSaved((s) => ({ ...s, [word]: false })); // roll back on failure
    });
  };

  if (words.length === 0) return null;

  return (
    <div className="mt-6 rounded-2xl border border-white/[0.08] bg-surface-2/30 p-4">
      <p className="text-sm font-semibold text-heading">Save words to your Word Bank</p>
      <p className="mt-0.5 text-xs text-muted-foreground">Drag a word into the bank to save it.</p>
      <DndContext
        sensors={sensors}
        onDragStart={() => setDragging(true)}
        onDragEnd={onDragEnd}
        onDragCancel={() => setDragging(false)}
      >
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {words.map((w) => (
              <DraggableWord key={w} word={w} saved={!!saved[w]} />
            ))}
          </div>
          <Wallet active={dragging} />
        </div>
      </DndContext>
    </div>
  );
}
