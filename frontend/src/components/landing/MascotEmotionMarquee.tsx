"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { PixelMascot } from "@/components/v3/PixelMascot";
import { LazyMount } from "./LazyMount";
import type { MascotEmotion } from "@/lib/emotion";

// Emotion spotlight — one big K.AI mascot that cycles through its whole
// emotional range, with a chip per emotion the visitor can tap to pick one.
// (It used to be an Embla marquee of 14 mascots, each its own <canvas> with a
// per-frame blur/scale pass; a single canvas carries the same idea at a
// fraction of the cost.) Auto-cycling stops as soon as someone picks a chip,
// and never starts for prefers-reduced-motion.

const EMOTIONS: { emotion: MascotEmotion; label: string; caption: string }[] = [
  { emotion: "greeting", label: "Greeting", caption: "Welcomes you back" },
  { emotion: "happy", label: "Happy", caption: "Celebrates your wins" },
  { emotion: "love", label: "Proud", caption: "Roots for you" },
  { emotion: "idea", label: "Idea", caption: "Sparks new angles" },
  { emotion: "tips", label: "Tips", caption: "Shares gentle nudges" },
  { emotion: "surprised", label: "Surprised", caption: "Cheers breakthroughs" },
  { emotion: "thinking", label: "Thinking", caption: "Works it through with you" },
  { emotion: "asking", label: "Curious", caption: "Asks to understand you" },
  { emotion: "conversing", label: "Talking", caption: "Keeps the chat flowing" },
  { emotion: "confused", label: "Confused", caption: "Sits with the tricky bits" },
  { emotion: "sad", label: "Gentle", caption: "Feels your setbacks" },
  { emotion: "scared", label: "Nervous", caption: "Steadies your nerves" },
  { emotion: "angry", label: "Determined", caption: "Never gives up on you" },
  { emotion: "idle", label: "Present", caption: "Always here for you" },
];

const CYCLE_MS = 2200;

/**
 * @param bare  Render only the interactive panel (the page supplies its own
 *              heading) — used by the landing, which server-renders the copy.
 */
export function MascotEmotionMarquee({ bare = false }: { bare?: boolean }) {
  const [index, setIndex] = useState(0);
  const [manual, setManual] = useState(false);
  const [reduced, setReduced] = useState(false);

  // Read the motion preference after mount (in a callback, not the effect
  // body) so SSR and the first client render match.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    const id = requestAnimationFrame(sync);
    mq.addEventListener("change", sync);
    return () => {
      cancelAnimationFrame(id);
      mq.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    if (manual || reduced) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % EMOTIONS.length), CYCLE_MS);
    return () => clearInterval(id);
  }, [manual, reduced]);

  const current = EMOTIONS[index];

  const panel = (
    <div
      data-lp-card
      className="c-box grid items-center gap-6 rounded-[28px] p-5 sm:p-7 md:grid-cols-[260px_1fr] md:gap-10"
    >
      {/* Spotlight */}
      <div className="flex flex-col items-center text-center">
        <div className="grid aspect-square w-full max-w-[200px] place-items-center rounded-[28px] bg-surface-2/70">
          {/* Only the <canvas> (a rAF loop) is lazy: it runs while near the
              viewport. The labels and chips below are ordinary HTML. */}
          <LazyMount className="grid h-full w-full place-items-center" unmountOnExit>
            <PixelMascot emotion={current.emotion} size={150} paused={reduced} />
          </LazyMount>
        </div>
        <p className="mt-4 text-lg font-bold text-heading">{current.label}</p>
        <p className="min-h-[1.5rem] text-sm text-muted-foreground">{current.caption}</p>
      </div>

      {/* Emotion picker */}
      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Tap a feeling
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="K.AI's emotions">
          {EMOTIONS.map((e, i) => {
            const on = i === index;
            return (
              <button
                key={e.emotion}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  setManual(true);
                  setIndex(i);
                }}
                className={cn(
                  "min-h-11 cursor-pointer rounded-full border px-4 text-sm font-semibold transition-colors duration-200",
                  on
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "border-border bg-surface-2/70 text-body hover:bg-surface-3 hover:text-heading",
                )}
              >
                {e.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  if (bare) return panel;

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto mb-12 max-w-[1280px] px-5 text-center md:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Made to care</p>
        <h2 className="mt-3 text-3xl font-extrabold text-heading md:text-5xl">An AI that feels it with you</h2>
        <p className="mx-auto mt-3 max-w-2xl text-body md:text-lg">
          Your coach reads the moment and reacts — celebrating wins, steadying nerves, and staying
          right beside you through every slip.
        </p>
      </div>
      <div className="mx-auto max-w-5xl px-5 md:px-8">{panel}</div>
    </section>
  );
}
