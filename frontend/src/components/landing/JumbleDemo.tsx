"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { TrainFront } from "lucide-react";

import { cn } from "@/lib/utils";
import AiCoachMascot from "@/components/jumbleWordsComponent/AiCoachMascot";
import TrainEngine from "@/components/jumbleWordsComponent/TrainEngine";
import { DemoSteps } from "./DemoSteps";

// Landing showcase for Jumble Words — a self-contained, looping demo. A
// scripted cursor lifts word tiles out of the "yard"; each becomes a coach on a
// faithful, scaled-down replica of the in-game train world (same .coach /
// .train-track / .train-buffer styles + departure / crash choreography). It
// presses Submit and the AI coach reacts. Runs forever as a two-beat loop: one
// correct round, then one wrong round, then repeats.

type Outcome = "correct" | "wrong";
type Feedback = Outcome | null;
type Cursor = { x: number; y: number; visible: boolean; clicking: boolean };

const YARD = ["English", "can", "I", "speak"]; // initial yard (shuffled) order
// The order the cursor clicks tiles in each round. Correct → builds
// "I can speak English"; wrong → the yard order, an obviously scrambled line.
const PICK_ORDER: Record<Outcome, string[]> = {
  correct: ["I", "can", "speak", "English"],
  wrong: ["English", "can", "I", "speak"],
};

const STEP_LABELS = ["Arrange words", "Submit"] as const;

// Coach colour variants — copied verbatim from the real WordDragDrop board.
const COACH_PALETTES = [
  { body: "linear-gradient(#5D3A7A,#2D1942)", roof: "linear-gradient(#7a5da0,#3a2555)", text: "#f0ecff" },
  { body: "linear-gradient(#297A85,#113D42)", roof: "linear-gradient(#3a9eaa,#184f56)", text: "#e6fbff" },
  { body: "linear-gradient(#9C6339,#4F2D14)", roof: "linear-gradient(#c0824a,#6a3e1c)", text: "#fff0dd" },
  { body: "linear-gradient(#9E2F4C,#471120)", roof: "linear-gradient(#c24868,#5e1a30)", text: "#ffe6ee" },
];
// Deterministic derail scatter per coach (the real board randomises this; a
// fixed table keeps the demo pure and lint-clean while still looking chaotic).
const DERAIL_VECTORS = [
  { x: -120, y: 150, r: -90 },
  { x: 95, y: 120, r: 70 },
  { x: -60, y: 185, r: 120 },
  { x: 140, y: 110, r: -55 },
];

const BAND_SCALE = 0.6; // shrinks the original 184px-tall band to fit inline
const PARKED: Cursor = { x: 16, y: 16, visible: false, clicking: false };

// One rail car — mirrors the real board's BandCoach (same markup + classes).
function BandCoach({
  word,
  index,
  derail,
}: {
  word: string;
  index: number;
  derail?: { x: number; y: number; r: number };
}) {
  const pal = COACH_PALETTES[index % COACH_PALETTES.length];
  const style: Record<string, string> = {};
  if (derail) {
    style["--sx"] = `${derail.x}px`;
    style["--sy"] = `${derail.y}px`;
    style["--sr"] = `${derail.r}deg`;
  }
  return (
    <div className={cn("coach", derail && "anim-coach-derail")} style={style as CSSProperties}>
      <div className="coach-roof" style={{ background: pal.roof }} />
      <div className="coach-body" style={{ background: pal.body, color: pal.text }}>
        <div className="coach-windows">
          <span className="coach-window" />
          <span className="coach-window" />
          <span className="coach-window" />
        </div>
        <div className="coach-word">{word}</div>
      </div>
      <div className="coach-wheels">
        <span className="coach-wheel" />
        <span className="coach-wheel" />
      </div>
    </div>
  );
}

export function JumbleDemo() {
  const cardRef = useRef<HTMLDivElement>(null);
  const bandRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const [pool, setPool] = useState<string[]>(YARD);
  const [placed, setPlaced] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [cursor, setCursor] = useState<Cursor>(PARKED);

  useEffect(() => {
    let cancelled = false;
    const sleep = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

    // Centre of a [data-tile] / [data-submit] element, relative to the card.
    const centerOf = (selector: string) => {
      const card = cardRef.current;
      if (!card) return null;
      const el = card.querySelector(selector);
      if (!el) return null;
      const c = card.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      return { x: r.left - c.left + r.width / 2, y: r.top - c.top + r.height / 2 };
    };

    const moveTo = async (selector: string, glide = 620) => {
      const p = centerOf(selector);
      if (!p) return;
      setCursor((c) => ({ ...c, x: p.x, y: p.y, visible: true }));
      await sleep(glide);
    };

    const click = async () => {
      setCursor((c) => ({ ...c, clicking: true }));
      await sleep(150);
      setCursor((c) => ({ ...c, clicking: false }));
      await sleep(80);
    };

    const run = async () => {
      let outcome: Outcome = "correct";
      await sleep(500); // let the card lay out before the first measurement
      while (!cancelled) {
        // ── reset the board for this round ──
        groupRef.current?.style.removeProperty("--travel-x");
        setFeedback(null);
        setPlaced([]);
        setPool(YARD);
        setCursor(PARKED);
        await sleep(700);
        if (cancelled) return;

        // ── Step 1: click each tile, in this round's order, onto the rail ──
        for (const word of PICK_ORDER[outcome]) {
          if (cancelled) return;
          await moveTo(`[data-tile="${word}"]`);
          if (cancelled) return;
          await click();
          if (cancelled) return;
          setPool((prev) => prev.filter((w) => w !== word));
          setPlaced((prev) => [...prev, word]);
          await sleep(480);
        }

        // ── Step 2: press Submit, then resolve the round ──
        if (cancelled) return;
        await moveTo("[data-submit]");
        if (cancelled) return;
        await click();
        if (cancelled) return;
        // On a wrong answer the train races to the buffer — measure the gap
        // (in the band's own unscaled coordinate space) before the crash class
        // is applied, exactly like the real board.
        if (outcome === "wrong" && bandRef.current && groupRef.current) {
          const travel = Math.max(
            bandRef.current.clientWidth - groupRef.current.scrollWidth - 64,
            0,
          );
          groupRef.current.style.setProperty("--travel-x", `${travel}px`);
        }
        setFeedback(outcome);
        setCursor((c) => ({ ...c, visible: false }));

        await sleep(2800); // hold on the result
        outcome = outcome === "correct" ? "wrong" : "correct"; // flip the beat
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  // Step 0 (Arrange) while building; step 1 (Submit) once a result is in.
  const activeStep = feedback ? 1 : 0;
  // Group choreography: depart on correct, race-to-buffer crash on wrong.
  const groupAnim =
    feedback === "correct"
      ? "anim-train-roll-out"
      : feedback === "wrong"
        ? "anim-train-crash-travel"
        : "";

  const message =
    feedback === "correct"
      ? "Perfect — all aboard! 🎉"
      : feedback === "wrong"
        ? "Derailed! Let's re-jumble."
        : "Watch me arrange the words…";

  return (
    <div
      ref={cardRef}
      data-lp-card
      className="c-box relative flex min-h-[580px] w-full flex-col justify-between overflow-hidden rounded-[28px] p-6"
    >
      {/* Header — title + step indicator, kept as one block */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
          Jumble Words
        </p>

        {/* Two-step indicator: Arrange words → Submit */}
        <div className="mt-4">
          <DemoSteps labels={STEP_LABELS} active={activeStep} />
        </div>
      </div>

      {/* Word yard — label + tiles, kept as one block */}
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          <TrainFront className="h-3.5 w-3.5" aria-hidden="true" /> Word yard
        </p>
        <div className="flex min-h-[52px] flex-wrap content-start gap-2 rounded-2xl border-2 border-dashed border-border bg-surface-1/40 p-3">
        {pool.length === 0 ? (
          <span className="w-full py-1 text-center text-xs italic text-muted-foreground">
            All words on the rail ✓
          </span>
        ) : (
          pool.map((w) => (
            <span
              key={w}
              data-tile={w}
              className="rounded-md border border-amber-600/40 bg-gradient-to-b from-[#3b3025] to-[#2a221b] px-3 py-2 text-sm font-medium tracking-wide text-amber-100"
            >
              {w}
            </span>
          ))
        )}
        </div>
      </div>

      {/* Submit (the cursor presses this) */}
      <div className="flex justify-center">
        <button
          type="button"
          data-submit
          className={cn(
            "rounded-full px-7 py-2.5 text-sm font-bold transition-all",
            feedback === "correct"
              ? "bg-green-500 text-[#0b0e14]"
              : feedback === "wrong"
                ? "bg-red-500 text-white"
                : "bg-surface-2 text-heading",
            cursor.clicking && "scale-95",
          )}
        >
          Submit
        </button>
      </div>

      {/* Mini train — faithful replica of the in-game train world, scaled down */}
      <div
        className="relative w-full overflow-hidden rounded-2xl border border-border"
        style={{ height: 184 * BAND_SCALE, background: "var(--bg)" }}
      >
        {placed.length === 0 && (
          <p className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 text-center text-[11px] italic text-muted-foreground">
            Each word you place becomes a coach 🚃
          </p>
        )}
        {/* Inner stage holds the train at its real (unscaled) size, then the
            whole thing is scaled — so every offset / animation stays faithful. */}
        <div
          ref={bandRef}
          className="absolute left-0 top-0"
          style={{
            width: `${100 / BAND_SCALE}%`,
            height: 184,
            transform: `scale(${BAND_SCALE})`,
            transformOrigin: "top left",
          }}
        >
          <div className="train-track" />
          <div className={cn("train-buffer", feedback === "correct" && "train-buffer--go")} />
          <div ref={groupRef} className={cn("train-group", groupAnim)} style={{ left: 28 }}>
            <div className="train-scale">
              {placed.map((w, i) => (
                <BandCoach
                  key={w}
                  word={w}
                  index={i}
                  derail={
                    feedback === "wrong"
                      ? DERAIL_VECTORS[i % DERAIL_VECTORS.length]
                      : undefined
                  }
                />
              ))}
              <TrainEngine className={cn(feedback === "wrong" && "anim-engine-crash")} />
            </div>
          </div>
        </div>
      </div>

      {/* AI coach mascot — reacts on correct and wrong */}
      <div className="flex items-center gap-7">
        <span
          className={cn(
            "mascot-ring",
            feedback === "correct" && "mascot-ring--correct",
            feedback === "wrong" && "mascot-ring--wrong",
          )}
        >
          <AiCoachMascot feedback={feedback} size={64} />
        </span>
        <div
          className={cn(
            "rounded-2xl rounded-bl-sm px-3 py-2 text-sm font-medium transition-colors",
            feedback === "correct"
              ? "bg-green-500/10 text-green-700 dark:text-green-200"
              : feedback === "wrong"
                ? "bg-red-500/10 text-red-700 dark:text-red-200"
                : "bg-surface-2 text-muted-foreground",
          )}
        >
          {message}
        </div>
      </div>

      {/* Scripted pointer — glides to each tile / Submit and "clicks" */}
      <div
        className="pointer-events-none absolute left-0 top-0 z-40 transition-transform duration-[600ms] ease-[cubic-bezier(0.34,1.1,0.64,1)]"
        style={{
          transform: `translate(${cursor.x}px, ${cursor.y}px)`,
          opacity: cursor.visible ? 1 : 0,
        }}
      >
        <div className={cn("relative transition-transform", cursor.clicking && "scale-90")}>
          {cursor.clicking && (
            <span className="absolute -left-2 -top-2 h-8 w-8 animate-ping rounded-full border-2 border-primary/70" />
          )}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]"
          >
            <path
              d="M5 3l14 7-6 2-2 6-6-15z"
              fill="#fff"
              stroke="#0b0e14"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
