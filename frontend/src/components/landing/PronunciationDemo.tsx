"use client";

import { Fragment, useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { SpeakStep } from "@/app/(app)/dashboard/pronunciation/components/SpeakStep";
import { FeedbackStep } from "@/app/(app)/dashboard/pronunciation/components/FeedbackStep";
import type { RecorderPhase } from "@/app/(app)/dashboard/pronunciation/hooks/useRecorderStateMachine";
import type { PronunciationAttemptResult } from "@/lib/v3Pronunciation";

// Landing showcase for the Pronunciation Trainer — reuses the REAL step
// components (Speak → Check → Feedback) driven by a scripted timeline and a
// mock scored result, looping forever. The Listen step is skipped here so the
// demo opens straight on the action. No mic / backend involved.

const SENTENCE = "I'd like to add one quick point.";
const COUNTDOWN_MS = 3000;
const RECORD_MS = 6000;
const noop = () => {};

const MOCK_RESULT: PronunciationAttemptResult = {
  attemptId: "demo",
  order: 1,
  difficulty: "easy",
  expectedText: SENTENCE,
  transcript: "I'd like to add one quick point",
  accuracy: 0.92,
  accuracyPercent: 92,
  tier: "HIGH",
  feedbackTier: "EXCELLENT",
  message: "Crisp and confident — your stress and pacing were on point.",
  correctWords: ["I'd", "like", "to", "add", "one", "point"],
  incorrectWords: ["quick"],
  words: [
    { expected: "I'd", heard: "I'd", status: "CORRECT", similarity: 0.98, confidence: 0.96 },
    { expected: "like", heard: "like", status: "CORRECT", similarity: 0.97, confidence: 0.95 },
    { expected: "to", heard: "to", status: "CORRECT", similarity: 0.99, confidence: 0.97 },
    { expected: "add", heard: "add", status: "UNCLEAR", similarity: 0.71, confidence: 0.55, reason: "The audio was a little muffled here — try again, louder." },
    { expected: "one", heard: "one", status: "CORRECT", similarity: 0.95, confidence: 0.93 },
    { expected: "quick", heard: "quik", status: "INCORRECT", similarity: 0.62, confidence: 0.81, reason: "Soften the 'k' and keep the vowel short." },
    { expected: "point", heard: "point", status: "CORRECT", similarity: 0.97, confidence: 0.95 },
  ],
  durationMs: 4200,
  tips: [
    { title: "Stress the key word", body: 'Emphasise "quick" a touch more so the sentence sounds natural and assertive.' },
  ],
  xpEarned: 30,
  totalXp: 1240,
  currentLevel: 6,
  leveledUp: false,
  combo: 3,
  createdAt: "",
};

type Stage = "countdown" | "recording" | "review" | "feedback";

// The three labelled steps shown to the user, in order. Speak covers the
// countdown + recording phases; Check is the instant scoring; Feedback is the score.
const STEP_LABELS = ["Speak", "Check", "Feedback"] as const;

export function PronunciationDemo() {
  const [stage, setStage] = useState<Stage>("countdown");
  const [remainingMs, setRemainingMs] = useState(COUNTDOWN_MS);

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let ticker: ReturnType<typeof setInterval> | null = null;
    const at = (ms: number, fn: () => void) => {
      timers.push(setTimeout(() => { if (!cancelled) fn(); }, ms));
    };
    const stopTick = () => { if (ticker) { clearInterval(ticker); ticker = null; } };
    const startTick = (total: number) => {
      stopTick();
      const start = Date.now();
      ticker = setInterval(() => {
        if (cancelled) return;
        setRemainingMs(Math.max(0, total - (Date.now() - start)));
      }, 120);
    };

    const run = () => {
      stopTick();
      // Open straight on the Speak step — the Listen step is intentionally
      // skipped in this landing demo.
      setStage("countdown");
      setRemainingMs(COUNTDOWN_MS);
      startTick(COUNTDOWN_MS);
      const tRec = COUNTDOWN_MS;
      const tReview = tRec + 3200;
      const tFeedback = tReview + 2200;
      const tLoop = tFeedback + 5400;

      at(tRec, () => { setStage("recording"); setRemainingMs(RECORD_MS); startTick(RECORD_MS); });
      at(tReview, () => { stopTick(); setStage("review"); });
      at(tFeedback, () => setStage("feedback"));
      at(tLoop, run);
    };

    run();
    return () => { cancelled = true; timers.forEach(clearTimeout); stopTick(); };
  }, []);

  const isSpeak = stage === "countdown" || stage === "recording" || stage === "review";
  // Which labelled step is on screen: Speak (0) · Check (1) · Feedback (2).
  const activeStep = stage === "feedback" ? 2 : stage === "review" ? 1 : 0;

  return (
    <div className="c-box w-full overflow-hidden rounded-[28px] p-6">
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
        Pronunciation Partner
      </p>

      {/* Step labels — make it obvious which stage of the flow is showing. */}
      <div className="mb-6 flex items-center justify-center gap-1.5">
        {STEP_LABELS.map((label, i) => (
          <Fragment key={label}>
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors",
                i === activeStep
                  ? "bg-gradient-to-br from-[#f59e0b] to-[#f97316] text-[#0b0e14]"
                  : "bg-surface-2 text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "grid h-4 w-4 place-items-center rounded-full text-[9px] font-bold",
                  i === activeStep ? "bg-[#0b0e14]/20 text-[#0b0e14]" : "bg-white/10",
                )}
              >
                {i + 1}
              </span>
              {label}
            </span>
            {i < STEP_LABELS.length - 1 && (
              <span
                className={cn(
                  "h-px w-4 transition-colors",
                  i < activeStep ? "bg-[#f59e0b]" : "bg-white/10",
                )}
              />
            )}
          </Fragment>
        ))}
      </div>

      {isSpeak && (
        <SpeakStep
          sentence={SENTENCE}
          phase={stage as RecorderPhase}
          remainingMs={remainingMs}
          countdownMs={COUNTDOWN_MS}
          recordDurationMs={RECORD_MS}
          stream={null}
          errorMessage={null}
          onMicClick={noop}
          onStopClick={noop}
          onRetry={noop}
          demo
        />
      )}

      {stage === "feedback" && (
        <FeedbackStep result={MOCK_RESULT} onContinue={noop} onNext={noop} demo />
      )}
    </div>
  );
}
