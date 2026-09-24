import { Lock, Mic, Volume2 } from "lucide-react";

import { Wave, cssVars } from "./Wave";

// Pronunciation Coach as a pipeline: you read the sentence aloud (voice) →
// every word gets a colour (clear / unclear / needs work) and the attempt a
// score → the missed word opens up: syllables with the stress in CAPITALS, the
// same sounds in your own script, what you actually said, and a listen button.
// Matches the real scorer's output (server/gemini/scoring.ts: syllables +
// native respelling + "You said …"); nothing is stored (D-036/D-038).
// 11 s loop, figureStyles `pr-*`.

type Status = "ok" | "warn" | "bad";
const WORDS: { w: string; s: Status }[] = [
  { w: "I'll", s: "ok" },
  { w: "see", s: "ok" },
  { w: "you", s: "ok" },
  { w: "on", s: "warn" },
  { w: "Wednesday", s: "bad" },
];
const SCORE = 72;
const R = 22;
const C = 2 * Math.PI * R;

const LEGEND: { s: Status; label: string }[] = [
  { s: "ok", label: "Clear" },
  { s: "warn", label: "Unclear" },
  { s: "bad", label: "Needs work" },
];

export function PronunciationFigure() {
  return (
    <div
      data-fig
      role="img"
      aria-label="Pronunciation Coach: you read “I'll see you on Wednesday” aloud. Each word is marked clear, unclear or needs work, with a score of 72%. The missed word, Wednesday, opens up: say it WENZ-day — वेन्ज़-डे in Hindi script. You said wed-nes-day. A listen button plays it. Your recording is not stored."
      className="lp-glass-strong w-full rounded-[28px] p-5 sm:p-7"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="lp-tag text-heading">Read aloud</span>
        <span className="lp-tag flex items-center gap-1.5 text-body">
          <Lock className="h-3 w-3" aria-hidden="true" /> Not stored
        </span>
      </div>

      {/* 1 · your voice */}
      <div className="mt-5 flex items-center gap-4">
        <span className="relative grid h-12 w-12 shrink-0 place-items-center">
          <span className="pr-rings absolute inset-0">
            <span className="fl-ping absolute inset-0 rounded-full bg-primary/30" />
            <span className="fl-ping fl-ping-late absolute inset-0 rounded-full bg-primary/25" />
          </span>
          <span
            className="relative grid h-12 w-12 place-items-center rounded-full text-primary-foreground"
            style={{ background: "var(--pro-pill)" }}
          >
            <Mic className="h-5 w-5" aria-hidden="true" />
          </span>
        </span>
        <Wave n={34} seed={11} live spread className="pr-voice text-primary" style={cssVars({ "--wh": "34px" })} />
      </div>

      <Down />

      {/* 2 · word by word + score */}
      <div className="flex items-center gap-4">
        <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {WORDS.map((x, k) => (
            <span key={x.w} className="relative">
              <span
                className={`pr-word relative block overflow-hidden rounded-xl border border-border bg-surface-2/80 px-3 py-1.5 text-[0.95rem] font-semibold text-heading ${
                  x.s === "bad" ? "pr-word-pick" : ""
                }`}
                style={cssVars({ "--tone": `var(--lp-${x.s})` })}
              >
                <span className={`pr-tint pr-t${k} absolute inset-0`} />
                <span className="relative">{x.w}</span>
              </span>
              {/* the missed word points down to its breakdown */}
              {x.s === "bad" ? (
                <svg viewBox="0 0 12 28" className="absolute left-1/2 top-full h-7 w-3 -translate-x-1/2 overflow-visible" aria-hidden="true">
                  <line x1="6" y1="5" x2="6" y2="20" className="fl-dash" />
                  <path d="M2 17 L6 23 L10 17" className="fl-head" />
                </svg>
              ) : null}
            </span>
          ))}
        </div>
        <span className="relative grid h-14 w-14 shrink-0 place-items-center">
          <svg viewBox="0 0 56 56" className="absolute inset-0 -rotate-90" aria-hidden="true">
            <circle cx="28" cy="28" r={R} className="fill-none stroke-heading/10" strokeWidth="5" />
            <circle
              cx="28"
              cy="28"
              r={R}
              className="pr-arc fill-none stroke-primary"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={C}
              style={cssVars({ "--c": `${C}px`, "--off": `${C * (1 - SCORE / 100)}px` })}
            />
          </svg>
          <span className="pr-score relative text-sm font-bold text-heading">{SCORE}%</span>
        </span>
      </div>

      {/* 3 · the missed word, opened up */}
      <div className="pr-detail mt-7 rounded-2xl border border-l-4 border-border bg-surface-2/70 p-4" style={{ borderLeftColor: "var(--lp-bad)" }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="pr-row lp-kinetic text-2xl font-bold text-heading sm:text-3xl" style={cssVars({ "--k": 0 })}>
              <span className="text-primary">WENZ</span>
              <span className="text-body"> · day</span>
            </p>
            <p lang="hi" className="pr-row mt-1 text-xl font-semibold text-heading sm:text-2xl" style={cssVars({ "--k": 1 })}>
              वेन्ज़-डे
            </p>
          </div>
          <span className="pr-row inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground" style={cssVars({ "--k": 3 })}>
            <Volume2 className="h-4 w-4" aria-hidden="true" /> Listen
          </span>
        </div>
        <p className="pr-row mt-3 flex items-center gap-2 border-t border-border pt-3" style={cssVars({ "--k": 2 })}>
          <span className="lp-tag text-body">You said</span>
          <span className="lp-struck text-sm font-semibold text-body">wed-nes-day</span>
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
        {LEGEND.map((l) => (
          <span key={l.s} className="lp-tag flex items-center gap-1.5 text-body">
            <span className="h-2 w-2 rounded-full" style={{ background: `var(--lp-${l.s})` }} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function Down() {
  return (
    <div className="flex h-7 items-center justify-start pl-5" aria-hidden="true">
      <svg viewBox="0 0 12 28" className="h-7 w-3 overflow-visible">
        <line x1="6" y1="3" x2="6" y2="20" className="fl-dash" />
        <path d="M2 17 L6 23 L10 17" className="fl-head" />
      </svg>
    </div>
  );
}
