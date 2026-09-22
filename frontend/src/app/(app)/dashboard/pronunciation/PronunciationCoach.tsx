"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HelpCircle, Mic } from "lucide-react";
import { useNextStep } from "nextstepjs";

import { Card } from "@/components/ui/card";
import {
  PRONUNCIATION_TOUR,
  PRONUNCIATION_TOUR_NAME,
  PRONUNCIATION_TOUR_QUERY,
  PRONUNCIATION_TOUR_SEEN_KEY,
} from "./pronunciationTour";
import {
  PronunciationAttemptResult,
  PronunciationDifficulty,
  PronunciationPhrase,
  pronunciationFeedbackMeta,
  v3FetchPronunciationPhrase,
  v3SubmitPronunciationAttempt,
} from "@/lib/v3Pronunciation";
import { useAppDispatch } from "@/store/hooks";
import { syncFromBackend, setCombo, triggerLevelUp } from "@/store/slices/xpSlice";
import { notifyBadgeAwards } from "@/lib/badgeAward";
import { useWordBankEnabled } from "@/lib/featureFlags";

import { SolveCelebration } from "@/components/v3/SolveCelebration";
import { ProgressStatsCard } from "@/components/v3/ProgressStatsCard";

import { DifficultyTabs } from "./components/DifficultyTabs";
import { FeedbackStep } from "./components/FeedbackStep";
import { ImproveStep } from "./components/ImproveStep";
import { ListenStep } from "./components/ListenStep";
import { PhraseSkeleton } from "./components/PhraseSkeleton";
import { ProgressCard } from "./components/ProgressCard";
import { SpeakStep } from "./components/SpeakStep";
import { StepperSidebar, type CoachStep } from "./components/StepperSidebar";
import { TipBar } from "./components/TipBar";
import { useRecorderStateMachine } from "./hooks/useRecorderStateMachine";
import { PronunciationWordWallet } from "./PronunciationWordWallet";

const SESSION_SIZE = 12;

// Persist the chosen difficulty so it survives reloads/sessions — pick
// Medium once and you land on Medium next time.
const DIFFICULTY_KEY = "pronunciation:difficulty";
const VALID_DIFFICULTIES: PronunciationDifficulty[] = ["easy", "medium", "hard"];

function readStoredDifficulty(): PronunciationDifficulty {
  if (typeof window === "undefined") return "easy";
  try {
    const v = window.localStorage.getItem(DIFFICULTY_KEY) as PronunciationDifficulty | null;
    return v && VALID_DIFFICULTIES.includes(v) ? v : "easy";
  } catch {
    return "easy";
  }
}

function writeStoredDifficulty(d: PronunciationDifficulty) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DIFFICULTY_KEY, d);
  } catch {
    // Storage unavailable (private mode / quota) — the choice just won't persist.
  }
}

// ── Onboarding demo data ──────────────────────────────────────────────────
// When the tour reaches a step tagged with `demoStep`, the Coach shows the real
// Listen/Speak/Feedback/Improve UI driven by this dummy data — nothing is
// recorded or sent. Mirrors the landing PronunciationDemo's mock.
const DEMO_SENTENCE = "I'd like to add one quick point.";
const DEMO_COUNTDOWN_MS = 3000;
const DEMO_RECORD_MS = 6000;
const demoNoop = () => {};

const DEMO_RESULT: PronunciationAttemptResult = {
  attemptId: "demo",
  order: 1,
  difficulty: "easy",
  expectedText: DEMO_SENTENCE,
  transcript: "I'd like to add one quick point",
  accuracy: 0.86,
  accuracyPercent: 86,
  tier: "HIGH",
  feedbackTier: "GREAT",
  message: "Nice and clear — just one word to polish.",
  correctWords: ["I'd", "like", "to", "add", "one", "point"],
  incorrectWords: ["quick"],
  words: [
    { expected: "I'd", heard: "I'd", status: "CORRECT", similarity: 0.98, confidence: 0.96 },
    { expected: "like", heard: "like", status: "CORRECT", similarity: 0.97, confidence: 0.95 },
    { expected: "to", heard: "to", status: "CORRECT", similarity: 0.99, confidence: 0.97 },
    { expected: "add", heard: "add", status: "CORRECT", similarity: 0.93, confidence: 0.9 },
    { expected: "one", heard: "one", status: "CORRECT", similarity: 0.95, confidence: 0.93 },
    { expected: "quick", heard: "quik", status: "INCORRECT", similarity: 0.62, confidence: 0.81, reason: "Soften the 'k' and keep the vowel short." },
    { expected: "point", heard: "point", status: "CORRECT", similarity: 0.97, confidence: 0.95 },
  ],
  durationMs: 4200,
  tips: [
    { title: "Stress the key word", body: 'Emphasise "quick" a touch more so the sentence sounds natural.' },
  ],
  xpEarned: 25,
  totalXp: 1240,
  currentLevel: 6,
  leveledUp: false,
  combo: 3,
  createdAt: "",
};

// DemoStage renders the real practice-step component for the tour's current
// demo step, with dummy data and no-op handlers (no mic, no submit).
function DemoStage({ demoStep }: { demoStep: CoachStep }) {
  switch (demoStep) {
    case "listen":
      return <ListenStep sentence={DEMO_SENTENCE} onReady={demoNoop} />;
    case "speak":
      return (
        <SpeakStep
          sentence={DEMO_SENTENCE}
          phase="recording"
          remainingMs={DEMO_RECORD_MS - 2200}
          countdownMs={DEMO_COUNTDOWN_MS}
          recordDurationMs={DEMO_RECORD_MS}
          stream={null}
          errorMessage={null}
          onMicClick={demoNoop}
          onStopClick={demoNoop}
          onRetry={demoNoop}
          demo
        />
      );
    case "feedback":
      return <FeedbackStep result={DEMO_RESULT} onContinue={demoNoop} onNext={demoNoop} demo />;
    case "improve":
      return <ImproveStep result={DEMO_RESULT} onNext={demoNoop} />;
    default:
      return null;
  }
}

// The Coach owns the per-session state: which step, which phrase, the
// recorder FSM, and the most recent scored attempt. Step components are
// pure presentational — they take props and bubble actions up.

export function PronunciationCoach({ accessToken }: { accessToken: string }) {
  const dispatch = useAppDispatch();
  const [step, setStep] = useState<CoachStep>("listen");
  const [difficulty, setDifficulty] = useState<PronunciationDifficulty>("easy");
  const [phrase, setPhrase] = useState<PronunciationPhrase | null>(null);
  const [phraseIndex, setPhraseIndex] = useState(1);
  const [result, setResult] = useState<PronunciationAttemptResult | null>(null);
  const [loadingPhrase, setLoadingPhrase] = useState(false);
  const [phraseError, setPhraseError] = useState<string | null>(null);
  const [celebrating, setCelebrating] = useState(false);

  const wordBankOn = useWordBankEnabled();

  const recorder = useRecorderStateMachine();

  const router = useRouter();
  const searchParams = useSearchParams();
  const { startNextStep, currentTour, currentStep: tourStepIndex, isNextStepVisible } = useNextStep();

  // When the pronunciation tour is on a step tagged with `demoStep`, drive the
  // Coach's UI as a no-send DEMO of that practice step (see DemoStage).
  const demoStep: CoachStep | undefined =
    isNextStepVisible && currentTour === PRONUNCIATION_TOUR_NAME
      ? (PRONUNCIATION_TOUR[0]?.steps?.[tourStepIndex] as { demoStep?: CoachStep } | undefined)?.demoStep
      : undefined;
  const inDemo = !!demoStep;

  // Auto-launch the walkthrough once on first visit, or whenever the URL
  // carries ?tour=1 (deep-link from a "How to play" CTA). The query param
  // is stripped afterwards so a reload won't re-trigger it.
  const tourFlag = searchParams?.get(PRONUNCIATION_TOUR_QUERY);
  useEffect(() => {
    const seen =
      typeof window !== "undefined" &&
      window.localStorage.getItem(PRONUNCIATION_TOUR_SEEN_KEY) === "1";
    const shouldStart = tourFlag === "1" || !seen;
    if (!shouldStart) return;

    // Let the freshly-mounted anchors paint before highlighting them.
    const t = setTimeout(() => startNextStep(PRONUNCIATION_TOUR_NAME), 400);
    if (tourFlag === "1") {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.delete(PRONUNCIATION_TOUR_QUERY);
      const qs = params.toString();
      router.replace(
        qs ? `/dashboard/pronunciation?${qs}` : "/dashboard/pronunciation",
        { scroll: false },
      );
    }
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourFlag]);

  const handleStartTour = useCallback(() => {
    startNextStep(PRONUNCIATION_TOUR_NAME);
  }, [startNextStep]);

  // Fetch a phrase. sessionOffset is the 0-indexed position within the
  // current 12-sentence session — the server adds it to the user's
  // pronunciation cursor and returns the resolved problem.
  const loadPhrase = useCallback(
    async (d: PronunciationDifficulty, sessionOffset: number) => {
      setLoadingPhrase(true);
      setPhraseError(null);
      try {
        const next = await v3FetchPronunciationPhrase(accessToken, d, sessionOffset);
        setPhrase(next);
        setResult(null);
        setStep("listen");
        recorder.reset();
      } catch (err) {
        setPhraseError(err instanceof Error ? err.message : "Could not load phrase");
      } finally {
        setLoadingPhrase(false);
      }
    },
    [accessToken, recorder],
  );

  // First-mount fetch. Once-only — subsequent loads are driven by the
  // onChange / next-sentence handlers, which is what the strict effect
  // rule wants. The starting difficulty is the one the user last pinned
  // (read here in the effect, so it's client-only and can't cause a
  // hydration mismatch).
  useEffect(() => {
    let cancelled = false;
    const initial = readStoredDifficulty();
    setDifficulty(initial);
    void v3FetchPronunciationPhrase(accessToken, initial, 0)
      .then((p) => {
        if (!cancelled) setPhrase(p);
      })
      .catch((err) => {
        if (!cancelled) setPhraseError(err instanceof Error ? err.message : "Could not load phrase");
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const onDifficultyChange = useCallback(
    (d: PronunciationDifficulty) => {
      setDifficulty(d);
      writeStoredDifficulty(d);
      setPhraseIndex(1);
      void loadPhrase(d, 0);
    },
    [loadPhrase],
  );

  const onArmSpeak = useCallback(() => {
    if (!phrase) return;
    setStep("speak");
    recorder.arm({
      countdownMs: phrase.countdownMs,
      recordDurationMs: phrase.recordDurationMs,
    });
  }, [phrase, recorder]);

  const onSubmit = useCallback(async () => {
    if (!phrase || !recorder.blob) return;
    recorder.beginSubmit();
    try {
      const scored = await v3SubmitPronunciationAttempt(accessToken, {
        audio: recorder.blob,
        order: phrase.order,
        difficulty: phrase.difficulty,
        durationMs: recorder.durationMs,
      });
      setResult(scored);
      // Sync the global Redux store so the navbar XP/level pills reflect
      // the new totals immediately. Mirrors what Jumble does on submit.
      dispatch(syncFromBackend({ totalXp: scored.totalXp, currentLevel: scored.currentLevel }));
      if (typeof scored.combo === "number") {
        dispatch(setCombo({ category: "pronunciation", value: scored.combo }));
      }
      // Fire the app-wide level-up card when this attempt crossed a level —
      // and only then (the level card takes the screen alone). Otherwise queue
      // any newly-earned badge celebrations.
      if (scored.leveledUp) {
        dispatch(triggerLevelUp(scored.currentLevel));
      } else {
        notifyBadgeAwards(dispatch, scored.newlyEarnedBadges);
      }
      recorder.submitSucceeded();
      setStep("feedback");
      // Full-screen celebration only on the top two bands (≥80% — "Great job!"
      // and "Excellent!"). Lower bands still show the XP pill in FeedbackStep
      // but no pop.
      if (pronunciationFeedbackMeta(scored).celebrate) {
        setCelebrating(true);
      }
    } catch (err) {
      recorder.submitFailed(err instanceof Error ? err.message : "Submit failed");
    }
  }, [accessToken, dispatch, phrase, recorder]);

  // No listen-back step: as soon as a take's audio is ready (and we heard
  // speech), score it. One submit per recording — errors wait for "Try again".
  const submittedBlobRef = useRef<Blob | null>(null);
  useEffect(() => {
    const blob = recorder.blob;
    if (recorder.phase !== "review" || !blob || recorder.errorMessage || submittedBlobRef.current === blob) return;
    submittedBlobRef.current = blob;
    void onSubmit();
  }, [recorder.phase, recorder.blob, recorder.errorMessage, onSubmit]);

  const onNext = useCallback(() => {
    const next = Math.min(SESSION_SIZE, phraseIndex + 1);
    setPhraseIndex(next);
    // sessionOffset is the 0-indexed offset within the current session;
    // phraseIndex is 1-indexed for display.
    void loadPhrase(difficulty, next - 1);
  }, [difficulty, loadPhrase, phraseIndex]);

  const sessionLabel = useMemo(() => `Sentence ${phraseIndex} of ${SESSION_SIZE}`, [phraseIndex]);
  // GameStatsCard reads Level/XP/combo straight from Redux, which onSubmit
  // keeps fresh (syncFromBackend + setCombo) — no local override needed here.

  return (
    <div className="flex flex-col gap-3 pb-[calc(40px_+_env(safe-area-inset-bottom))] md:gap-5 md:pb-0">
      <SolveCelebration
        visible={celebrating}
        xpEarned={result?.xpEarned ?? 0}
        onDone={() => setCelebrating(false)}
      />

      {/* Compact header — title, session progress, and the how-to-play
          replay trigger. Mirrors Jumble Words. */}
      <div id="pron-tour-title" className="flex flex-wrap items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Mic className="h-5 w-5" />
        </span>
        <h1 className="text-2xl font-bold text-heading">Pronunciation Coach</h1>
        <span className="hidden text-sm text-muted-foreground md:inline">· {sessionLabel}</span>

        <button
          id="pron-tour-help-btn"
          onClick={handleStartTour}
          aria-label="Show how to play"
          title="How to play"
          className="ml-auto flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-surface-2 px-3 py-1.5 text-xs font-semibold text-muted-foreground outline-none transition-colors hover:border-primary/40 hover:text-heading focus-visible:ring-2 focus-visible:ring-primary"
        >
          <HelpCircle className="h-4 w-4" />
          <span className="hidden sm:inline">How to play</span>
        </button>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 md:gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* ── Left Panel — the practice stage ── */}
        <div className="flex flex-col gap-4 md:gap-6">
          <Card id="pron-tour-stage" className="gap-0 p-4 md:p-8">
            <div className="flex flex-wrap items-center justify-end gap-3 md:mb-6">
              <DifficultyTabs id="pron-tour-difficulty" value={difficulty} onChange={onDifficultyChange} disabled={inDemo || (step !== "listen" && step !== "feedback" && step !== "improve")} />
            </div>


          <div className="mt-4 min-h-[240px] md:mt-6 md:min-h-[360px]">
            {inDemo && demoStep ? (
              <DemoStage demoStep={demoStep} />
            ) : (
              <>
            {phraseError && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {phraseError}
              </p>
            )}
            {loadingPhrase && <PhraseSkeleton />}

            {!loadingPhrase && phrase && step === "listen" && (
              <ListenStep sentence={phrase.sentence} onReady={onArmSpeak} />
            )}
            {!loadingPhrase && phrase && step === "speak" && (
              <SpeakStep
                sentence={phrase.sentence}
                phase={recorder.phase}
                remainingMs={recorder.remainingMs}
                countdownMs={recorder.countdownMs}
                recordDurationMs={recorder.recordDurationMs}
                stream={recorder.stream}
                errorMessage={recorder.errorMessage}
                onMicClick={recorder.skipCountdown}
                onStopClick={recorder.stopRecording}
                onRetry={recorder.retry}
              />
            )}
            {!loadingPhrase && phrase && step === "feedback" && result && (
              <FeedbackStep
                result={result}
                onContinue={() => setStep("improve")}
                onNext={onNext}
              />
            )}
            {wordBankOn && !loadingPhrase && phrase && step === "feedback" && result && (
              <PronunciationWordWallet sentence={phrase.sentence} accessToken={accessToken} />
            )}
            {!loadingPhrase && phrase && step === "improve" && result && (
              <ImproveStep result={result} onNext={onNext} />
            )}
              </>
            )}
          </div>
          </Card>

          {/* Tip card — hidden on phones to save space. */}
          <div className="hidden md:block">
            <TipBar step={step} />
          </div>
        </div>

        {/* ── Right Panel — side rail (stats on top, then stepper) ── */}
        <aside className="flex flex-col gap-3">
          <ProgressStatsCard
            id="pron-tour-stats"
            category="pronunciation"
            dots={{ total: SESSION_SIZE, current: phraseIndex - 1 }}
            mobileCompact
          />
          <StepperSidebar
            id="pron-tour-steps"
            current={inDemo && demoStep ? demoStep : step}
            onStepClick={inDemo ? undefined : (s) => setStep(s)}
          />
          {/* "Your progress" (attempts / best) — desktop only. */}
          <div className="hidden md:block">
            <ProgressCard accessToken={accessToken} refreshKey={result?.attemptId ? 1 : 0} />
          </div>
        </aside>
      </div>
    </div>
  );
}
