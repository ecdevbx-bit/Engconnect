import type { CSSProperties } from "react";

import type { TimelineMark, TimelineVisual } from "@/content/learn/types";

import { TONE, solidTint } from "../palette";

// Tense timeline: PAST ── now ──▶ FUTURE, with points (moments), spans
// (stretches of time) and repeats (habits). Built with HTML/CSS, not a scaled
// SVG, so labels keep a readable size at 375 px and wrap instead of shrinking.
// Positions are percentages of the axis; labels near an edge are anchored to
// that edge so nothing can overflow the page.

function anchorAt(x: number): CSSProperties {
  if (x < 20) return { left: `${Math.max(0, x - 2)}%` };
  if (x > 80) return { right: `${Math.max(0, 100 - x - 2)}%` };
  return { left: `${x}%`, transform: "translateX(-50%)" };
}

const center = (m: TimelineMark) => (m.kind === "point" ? m.at : (m.from + m.to) / 2);
const sideOf = (m: TimelineMark) => m.side ?? "top";

function describe(v: TimelineVisual): string {
  const now = v.now ?? 55;
  const where = (x: number) => (Math.abs(x - now) < 3 ? "now" : x < now ? "in the past" : "in the future");
  const parts = v.marks.map((m) => {
    if (m.kind === "point") return `${m.label} (${where(m.at)})`;
    const kind = m.kind === "repeat" ? "repeated" : "lasting";
    return `${m.label} (${kind}, from ${where(m.from)} to ${where(m.to)}${m.kind === "span" && m.arrow ? " and on" : ""})`;
  });
  return `Timeline from past to future. ${parts.join("; ")}.`;
}

function LabelRow({ marks, side }: { marks: TimelineMark[]; side: "top" | "bottom" }) {
  if (!marks.length) return null;
  return (
    <div className="relative col-start-2 h-16 sm:h-12" style={{ gridRow: side === "top" ? 2 : 4 }}>
      {marks.map((m, i) => {
        const x = center(m);
        const color = TONE[m.tone ?? "primary"];
        return (
          <div key={i}>
            <span
              className={`absolute w-px ${side === "top" ? "bottom-0" : "top-0"} h-2.5`}
              style={{ left: `${x}%`, backgroundColor: color }}
            />
            <span
              className={`absolute w-max max-w-[58%] rounded-md border px-1.5 py-0.5 text-xs font-semibold leading-snug text-heading ${
                side === "top" ? "bottom-2.5" : "top-2.5"
              }`}
              style={{ ...anchorAt(x), ...solidTint(color, 14, 45) }}
            >
              {m.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function Timeline({ v }: { v: TimelineVisual }) {
  const now = v.now ?? 55;
  const top = v.marks.filter((m) => sideOf(m) === "top");
  const bottom = v.marks.filter((m) => sideOf(m) === "bottom");

  return (
    <div role="img" aria-label={describe(v)} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2">
      {/* "now" marker spans every row of the middle column */}
      <div className="pointer-events-none relative col-start-2 row-span-4 row-start-1 self-stretch">
        <span
          className="absolute top-0 -translate-x-1/2 rounded-full bg-heading px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-background"
          style={{ left: `${now}%` }}
        >
          now
        </span>
        <span
          className="absolute bottom-0 top-5 border-l-2 border-dashed border-heading/35"
          style={{ left: `${now}%` }}
        />
      </div>

      {/* row 1: room for the "now" tag */}
      <div className="col-start-2 row-start-1 h-6" />

      <LabelRow marks={top} side="top" />

      {/* row 3: the axis */}
      <span className="col-start-1 row-start-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Past</span>
      <div className="relative col-start-2 row-start-3 h-8">
        <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-muted-foreground/40" />
        {v.marks.map((m, i) => {
          const color = TONE[m.tone ?? "primary"];
          if (m.kind === "point") {
            return (
              <span
                key={i}
                className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-[3px] ring-surface-1"
                style={{ left: `${m.at}%`, backgroundColor: color }}
              />
            );
          }
          if (m.kind === "span") {
            return (
              <span
                key={i}
                className="absolute top-1/2 h-2.5 -translate-y-1/2 rounded-full"
                style={{ left: `${m.from}%`, width: `${m.to - m.from}%`, backgroundColor: color }}
              >
                {m.arrow && (
                  <span
                    className="absolute -right-2 top-1/2 h-0 w-0 -translate-y-1/2 border-y-[7px] border-l-[9px] border-y-transparent"
                    style={{ borderLeftColor: color }}
                  />
                )}
              </span>
            );
          }
          const n = Math.max(2, m.count ?? 6);
          return Array.from({ length: n }, (_, j) => (
            <span
              key={`${i}-${j}`}
              className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-surface-1"
              style={{ left: `${m.from + ((m.to - m.from) * j) / (n - 1)}%`, backgroundColor: color }}
            />
          ));
        })}
      </div>
      <span className="col-start-3 row-start-3 flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        Future
        <svg viewBox="0 0 8 10" className="h-2.5 w-2" aria-hidden>
          <path d="M0 0 L8 5 L0 10 Z" fill="currentColor" />
        </svg>
      </span>

      <LabelRow marks={bottom} side="bottom" />
    </div>
  );
}
