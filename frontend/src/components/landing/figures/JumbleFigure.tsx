import { Check, Lightbulb, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { cssVars } from "./Wave";

// Jumble Words — shuffled word chips lift out of the yard and snap into the
// sentence rail one by one; a hint pops up first; the finished sentence turns
// green and pays XP (9 s loop, figureStyles `jb-*`). Everything is laid out in
// `em` inside a fixed-width stage whose font-size follows the card width
// (container query units), so the choreography scales without measuring.
//
// Chip k: w = width, (x0,y0,r0) = where it lies in the yard, x1 = its slot on
// the rail. Rail slots are packed left→right with a 0.45em gap (x1 values).
const RAIL_Y = 7.3;
const CHIPS = [
  { word: "I", w: 2.2, x0: 14.3, y0: 0.35, r0: 7, x1: 0 },
  { word: "have", w: 3.6, x0: 3.0, y0: 3.35, r0: 3, x1: 2.65 },
  { word: "worked", w: 4.6, x0: 0.3, y0: 0.55, r0: -5, x1: 6.7 },
  { word: "in", w: 2.4, x0: 10.4, y0: 0.6, r0: -3, x1: 11.75 },
  { word: "a", w: 2.2, x0: 8.0, y0: 3.55, r0: -6, x1: 14.6 },
  { word: "bank", w: 3.6, x0: 5.7, y0: 0.2, r0: 4, x1: 17.25 },
] as const;

const LEVELS = ["Easy", "Medium", "Hard", "Progressive"] as const;

export function JumbleFigure() {
  return (
    <div
      data-fig
      role="img"
      aria-label="Jumble Words: shuffled words — worked, bank, in, I, have, a — move into order to make “I have worked in a bank.” A hint helps when you're stuck, and a right answer earns XP. Four difficulty levels: easy, medium, hard and progressive."
      className="lp-glass-strong @container w-full rounded-[28px] p-5 sm:p-7"
    >
      <div className="flex flex-wrap gap-1">
        {LEVELS.map((l) => (
          <span
            key={l}
            className={cn(
              "lp-tag rounded-full px-2.5 py-1.5",
              l === "Medium" ? "bg-primary text-primary-foreground" : "bg-surface-2/80 text-body",
            )}
          >
            {l}
          </span>
        ))}
      </div>

      <div className="jb-stage relative mx-auto mt-11">
        {/* the yard (where shuffled words wait) */}
        <span className="absolute -inset-x-2 -top-2 h-[6.6em] rounded-2xl border-2 border-dashed border-heading/10" />
        <span className="lp-tag absolute -top-2 right-0 -translate-y-full pb-1.5 text-body">Shuffled</span>

        {/* hint bubble */}
        <span className="jb-hint absolute left-[12em] top-[3.45em] flex h-[2.3em] items-center gap-[0.4em] rounded-[0.8em] rounded-bl-sm px-[0.7em] text-[0.8em] font-semibold text-heading">
          <Lightbulb className="h-[1.2em] w-[1.2em] shrink-0 text-primary" aria-hidden="true" />
          Start with “I”
        </span>

        {/* the rail: one dashed slot per word, then the green "correct" line */}
        {CHIPS.map((c) => (
          <span
            key={`slot-${c.word}`}
            className="absolute h-[2.3em] rounded-[0.6em] border-2 border-dashed border-heading/15"
            style={{ left: `${c.x1}em`, top: `${RAIL_Y}em`, width: `${c.w}em` }}
          />
        ))}
        <span className="jb-rail absolute inset-x-0 h-[3px] rounded-full" style={{ top: `${RAIL_Y + 2.75}em` }} />

        {CHIPS.map((c, k) => (
          <span
            key={c.word}
            className={`jb-chip jb-c${k} absolute left-0 top-0 grid h-[2.3em] place-items-center rounded-[0.6em] font-bold text-heading`}
            style={cssVars({
              "--x0": `${c.x0}em`,
              "--y0": `${c.y0}em`,
              "--r0": `${c.r0}deg`,
              "--x1": `${c.x1}em`,
              "--y1": `${RAIL_Y}em`,
              "--w": `${c.w}em`,
            })}
          >
            {c.word}
          </span>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-5">
        <span className="lp-tag text-body">Tap in order</span>
        <span className="jb-ok flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full" style={{ background: "var(--lp-ok)" }}>
            <Check className="h-4 w-4 text-[#06120c]" strokeWidth={3} aria-hidden="true" />
          </span>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-primary-foreground"
            style={{ background: "var(--pro-pill)" }}
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> +15 XP
          </span>
        </span>
      </div>
    </div>
  );
}
