"use client";

import { useRef, useState } from "react";
import { Bot, ChevronDown, Sparkles, Volume2, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { badgeSubtitle, badgeTitle } from "@/lib/badges";
import { cn } from "@/lib/utils";
import {
  PronunciationAttemptResult,
  PronunciationWord,
  pronunciationFeedbackMeta,
} from "@/lib/v3Pronunciation";
import { PixelMascot } from "@/components/v3/PixelMascot";
import type { MascotEmotion } from "@/lib/emotion";

// Read a word aloud slowly with the device's own voice (free, offline-capable;
// prefers an Indian English voice when the phone has one).
function speakWord(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text.replace(/[^\p{L}' -]/gu, ""));
  const voices = window.speechSynthesis.getVoices();
  u.voice = voices.find((v) => v.lang === "en-IN") ?? voices.find((v) => v.lang.startsWith("en")) ?? null;
  u.lang = u.voice?.lang ?? "en-IN";
  u.rate = 0.7;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

// "pruh-nun-see-AY-shun" → syllables with the stressed (CAPITALS) one highlighted.
function Syllables({ value, className }: { value: string; className?: string }) {
  const parts = value.split("-").filter(Boolean);
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-1", className)}>
      {parts.map((p, i) => {
        const stressed = parts.length > 1 && /[A-Z]/.test(p) && p === p.toUpperCase();
        return (
          <span key={i} className="inline-flex items-baseline gap-x-1">
            {i > 0 && <span aria-hidden className="text-muted-foreground">·</span>}
            <span className={stressed ? "font-extrabold text-primary" : "text-heading"}>{p.toLowerCase()}</span>
          </span>
        );
      })}
    </span>
  );
}

function HearButton({ word }: { word: string }) {
  return (
    <button
      type="button"
      onClick={() => speakWord(word)}
      aria-label={`Hear how to say ${word}`}
      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary transition-colors hover:bg-primary/25 active:scale-95"
    >
      <Volume2 className="h-5 w-5" />
    </button>
  );
}

// Mascot reaction by accuracy band — mirrors the 5 feedback tiers.
function mascotFor(pct: number): MascotEmotion {
  if (pct >= 90) return "love";
  if (pct >= 80) return "happy";
  if (pct >= 55) return "conversing";
  if (pct >= 40) return "confused";
  return "sad";
}

// Accuracy ring + word chips + AI feedback callout. Sentence-level per
// spec — chip grid is built from result.words; no syllable breakdown is
// computed (UI inspiration only).

function statusClass(status: PronunciationWord["status"]) {
  switch (status) {
    case "CORRECT":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
    case "INCORRECT":
      return "border-rose-500/40 bg-rose-500/10 text-rose-300";
    case "UNCLEAR":
    default:
      return "border-amber-500/40 bg-amber-500/10 text-amber-300";
  }
}

function statusLabel(status: PronunciationWord["status"]) {
  switch (status) {
    case "CORRECT":
      return "Excellent";
    case "INCORRECT":
      return "Needs work";
    case "UNCLEAR":
    default:
      return "Unclear";
  }
}

function statusHeading(status: PronunciationWord["status"]) {
  switch (status) {
    case "CORRECT":
      return { label: "Correct pronunciation", className: "text-emerald-300" };
    case "INCORRECT":
      return { label: "Mispronunciation", className: "text-rose-300" };
    case "UNCLEAR":
    default:
      return { label: "Unclear audio", className: "text-amber-300" };
  }
}

function WordChip({
  word,
  index,
  demo = false,
}: {
  word: PronunciationWord;
  index: number;
  demo?: boolean;
}) {
  const heading = statusHeading(word.status);
  // Open the details on hover as well as on click. A short close delay lets the
  // pointer travel the gap from the chip onto the popover without dismissing it.
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverOpen = () => {
    if (demo) return;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const hoverClose = () => {
    if (demo) return;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onMouseEnter={hoverOpen}
          onMouseLeave={hoverClose}
          className={cn(
            "rounded-md border px-2.5 py-1 text-xs font-medium outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-primary/40",
            statusClass(word.status),
          )}
        >
          <span className="block text-sm font-semibold text-heading">{word.expected}</span>
          <span className="block">{statusLabel(word.status)}</span>
          {/* "Tap to expand" affordance — a bouncing chevron hints at the
              details popover. Hidden in the landing demo (chips aren't
              interactive there). */}
          {!demo && (
            <ChevronDown
              aria-hidden="true"
              className="mx-auto mt-0.5 block h-3.5 w-3.5 animate-bounce text-primary"
            />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="center"
        sideOffset={8}
        onMouseEnter={hoverOpen}
        onMouseLeave={hoverClose}
      >
        <dl className="space-y-1.5 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">Expected</dt>
            <dd className="font-medium text-heading">{word.expected}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">Heard</dt>
            <dd className="font-medium text-heading">{word.heard ? word.heard : "—"}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">Match</dt>
            <dd className="font-medium text-heading">{(word.similarity * 100).toFixed(1)}%</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">Confidence</dt>
            <dd className="font-medium text-heading">{word.confidence.toFixed(2)}</dd>
          </div>
        </dl>
        {(word.syllables || word.native) && (
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
            <div className="min-w-0 space-y-0.5 text-sm">
              {word.syllables && <Syllables value={word.syllables} />}
              {word.native && <p className="text-heading">{word.native}</p>}
            </div>
            {!demo && <HearButton word={word.expected} />}
          </div>
        )}
        <div className="mt-3 border-t border-white/[0.06] pt-3">
          <p className={cn("text-sm font-semibold", heading.className)}>{heading.label}</p>
          {word.reason && (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{word.reason}</p>
          )}
        </div>
        <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Word {index + 1}
        </p>
      </PopoverContent>
    </Popover>
  );
}

function AccuracyRing({ pct, stroke }: { pct: number; stroke: string }) {
  const radius = 42;
  const c = 2 * Math.PI * radius;
  const offset = c - (c * pct) / 100;
  return (
    <div className="relative h-28 w-28">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke={stroke}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 600ms ease" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display text-2xl font-bold text-heading">
        {pct}%
      </span>
    </div>
  );
}

export function FeedbackStep({
  result,
  onContinue,
  onNext,
  demo = false,
}: {
  result: PronunciationAttemptResult;
  onContinue: () => void;
  onNext: () => void;
  /** Landing-demo mode: hides the bottom AI-Feedback callout card. */
  demo?: boolean;
}) {
  const meta = pronunciationFeedbackMeta(result);
  const missed = (result.words ?? []).filter((w) => w.status !== "CORRECT");

  return (
    <div>
      <p className="text-center text-sm font-medium text-primary">AI Feedback</p>
      <p className="text-center text-sm text-muted-foreground">
        Here&apos;s how you pronounced the sentence.
      </p>

      <div className="mt-6 flex flex-col items-center gap-4 md:flex-row md:items-center md:justify-center md:gap-8">
        {/* Mobile: mascot + accuracy ring share one row. md+ unwraps (contents)
            so mascot · ring · text stay in the original single row. */}
        <div className="flex items-center justify-center gap-4 md:contents">
          <PixelMascot emotion={mascotFor(result.accuracyPercent)} size={96} className="shrink-0" />
          <AccuracyRing pct={result.accuracyPercent} stroke={meta.ringColor} />
        </div>
        <div className="text-center md:text-left">
          <p className="font-display text-2xl font-bold text-heading">{meta.label}</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Your pronunciation is {result.accuracyPercent}% accurate.
          </p>
          {result.xpEarned > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
              <Zap className="h-3.5 w-3.5" />
              +{result.xpEarned} XP
            </div>
          )}
          {result.leveledUp && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" />
              Level up! Now level {result.currentLevel}
            </div>
          )}
        </div>
      </div>

      {result.newlyEarnedBadges && result.newlyEarnedBadges.length > 0 && (
        <div className="mt-6 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4">
          <p className="text-sm font-semibold text-amber-200">New badge{result.newlyEarnedBadges.length > 1 ? "s" : ""} earned!</p>
          <ul className="mt-2 space-y-1 text-sm text-amber-100/90">
            {result.newlyEarnedBadges.map((id) => (
              <li key={id}>
                <span className="font-semibold">{badgeTitle(id)}</span>
                <span className="ml-2 text-amber-200/70">{badgeSubtitle(id)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8">
        <p className="text-center text-sm font-medium text-heading">Word breakdown</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {(result.words ?? []).map((w, i) => (
            <WordChip key={`${w.expected}-${i}`} word={w} index={i} demo={demo} />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> Correct
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-400" /> Mispronunciation
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400" /> Unclear
          </span>
        </div>
      </div>

      {!demo && missed.length > 0 && (
        <div className="mt-8">
          <p className="text-center text-sm font-medium text-heading">How to say the words you missed</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {missed.map((w, i) => (
              <div key={`${w.expected}-${i}`} className="rounded-xl border border-rose-400/30 bg-rose-500/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-lg font-bold text-heading">{w.expected.replace(/[^\p{L}'-]/gu, "")}</p>
                    {w.syllables && <Syllables value={w.syllables} className="mt-0.5 text-base" />}
                    {w.native && <p className="mt-0.5 text-base text-heading">{w.native}</p>}
                  </div>
                  <HearButton word={w.expected} />
                </div>
                {w.heard && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    You said: <span className="font-semibold text-rose-300">&ldquo;{w.heard}&rdquo;</span>
                  </p>
                )}
                {w.reason && <p className="mt-1 text-sm leading-relaxed text-body">{w.reason}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {!demo && (
        <div className="mt-8 flex items-start gap-3 rounded-xl border border-white/[0.06] bg-surface-2/40 p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <Bot className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">AI Feedback</p>
            <p className="mt-1 text-sm text-muted-foreground">{result.message}</p>
          </div>
        </div>
      )}

      <div
        className={cn(
          "mt-6 flex flex-wrap items-center gap-3",
          demo ? "justify-between" : "justify-end",
        )}
      >
        <Button onClick={onContinue} size="lg" variant="secondary">
          See tips
        </Button>
        <Button onClick={onNext} size="lg">
          Next sentence →
        </Button>
      </div>
    </div>
  );
}
