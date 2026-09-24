"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { storageSeen } from "@/lib/safeStorage";
import dynamic from "next/dynamic";
import { HiSpeakerWave } from "react-icons/hi2";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { syncFromBackend, setCombo, triggerLevelUp, enqueueBadgeCelebrations } from "@/store/slices/xpSlice";
import { notifyBadgeAwards } from "@/lib/badgeAward";
import { type JumbleSentence } from "@/lib/apiClient";
import {
    v3FetchJumbleBatch,
    v3SubmitJumbleAnswer,
    v3FetchJumbleHint,
    v3FetchJumbleClue,
    type V3JumbleHint,
    type V3JumbleClue,
    type JumbleDifficulty,
} from "@/lib/v3Game";
import { QuotaReachedError, remainingDifficulties } from "@/lib/quotaPrompt";
import { useExhaustedDifficulties } from "@/hooks/useExhaustedDifficulties";
import { useSession } from "@/lib/session";
import { useRouter, useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";
import { emitToast } from "@/lib/toast";
import { speak } from "@/lib/tts";
import { Puzzle, HelpCircle, Lightbulb } from "lucide-react";
import { useNextStep } from "nextstepjs";
import {
    JUMBLE_TOUR_NAME,
    JUMBLE_TOUR_QUERY,
    JUMBLE_TOUR_SEEN_KEY,
} from "./jumbleTour";

import { useGlowBorder } from "@/hooks/useGlowBorder";
import { useSfx } from "@/hooks/useSfx";
import { cn } from "@/lib/utils";
import SpeedTimer from "./SpeedTimer";
import JourneyStepper from "./JourneyStepper";
import AiCoachMascot from "./AiCoachMascot";
import JumbleSkeleton from "./JumbleSkeleton";
import JumbleHintCard from "./JumbleHintCard";
import CoachFeedbackCard from "./CoachFeedbackCard";
import { ProgressStatsCard } from "@/components/v3/ProgressStatsCard";

const WordDragDrop = dynamic(() => import("./WordDragDrop"), { ssr: false });

const SPEED_LIMIT_SEC = 18; // answer within this for a "quick" flourish
const IDLE_TIPS = [
    "Read the words, then picture the sentence in your head.",
    "Subject first, then the verb — that's the usual English order.",
    "The capitalized word almost always opens the sentence.",
    "The word with the full stop is your last word.",
];

const DIFFICULTIES: JumbleDifficulty[] = ["EASY", "MEDIUM", "HARD", "PROGRESSIVE"];

// Segmented easy/medium/hard switcher. The active tab is disabled so
// re-clicking it doesn't trigger a needless reload.
function DifficultyTabs({
    value,
    onChange,
    disabled,
}: {
    value: JumbleDifficulty;
    onChange: (d: JumbleDifficulty) => void;
    disabled?: boolean;
}) {
    // Difficulties this free user has used up today — flagged with a dot so
    // they can see at a glance which to avoid. (Empty for Pro / fresh sessions.)
    const exhausted = useExhaustedDifficulties("jumble");
    return (
        <div className="inline-flex items-center gap-0.5 rounded-full border border-white/[0.06] bg-surface-2 p-0.5">
            {DIFFICULTIES.map((d) => {
                const done = exhausted.includes(d.toLowerCase());
                return (
                    <button
                        key={d}
                        type="button"
                        onClick={() => onChange(d)}
                        disabled={disabled || value === d}
                        aria-pressed={value === d}
                        title={done ? "Daily free limit reached — go Pro for unlimited" : undefined}
                        className={cn(
                            "rounded-full px-3 py-1 text-xs font-semibold capitalize transition-colors",
                            value === d
                                ? "bg-primary text-[#0b0e14]"
                                : done
                                    ? "bg-red-500/10 text-red-600 ring-1 ring-inset ring-red-500/25 dark:text-red-400"
                                    : "text-muted-foreground hover:text-heading disabled:opacity-50",
                        )}
                    >
                        {d.toLowerCase()}
                    </button>
                );
            })}
        </div>
    );
}

export default function MainLayout() {
    const session = useSession();
    const v3AccessToken = session.data?.user?.accessToken ?? "";
    const authReady = !!v3AccessToken;
    // While NextAuth is still resolving the session, treat it as loading —
    // otherwise authReady is briefly false and the "Login Required" card
    // flashes before the token arrives.
    const sessionLoading = session.status === "loading";
    const router = useRouter();
    const searchParams = useSearchParams();
    const { startNextStep } = useNextStep();
    const dispatch = useAppDispatch();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [finished, setFinished] = useState(false);
    const [sentences, setSentences] = useState<JumbleSentence[]>([]);
    // Player-chosen difficulty. Drives the batch fetch — changing it reloads a
    // fresh round at that difficulty (see loadNextBatch's deps).
    const [difficulty, setDifficulty] = useState<JumbleDifficulty>("EASY");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // True when the batch fetch failed because the free daily quota for this
    // difficulty is used up — shows a "pick another difficulty / go Pro" state
    // (with the difficulty tabs) instead of the generic error card.
    const [quotaReached, setQuotaReached] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [resetKey, setResetKey] = useState(0);
    const { totalXP } = useAppSelector((state) => state.xp);
    const glowRef = useGlowBorder<HTMLDivElement>();

    // All enhancement bundles are permanently enabled.
    const flags = { juicy: true, streaks: true, coach: true, progress: true } as const;

    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
    const [xpGain, setXpGain] = useState<{ amount: number; quick: boolean } | null>(null);
    const [currentSentence, setCurrentSentence] = useState<string[]>([]);
    const questionStartRef = useRef<number>(Date.now());

    // ── Hint flow ──────────────────────────────────────────────────────────
    // wrongAttempts counts consecutive misses on the *current* question (it
    // survives the resetKey remount that lets the player retry the same
    // sentence). After 2, the AI coach offers a hint (or the 💡 button, any
    // time). The ladder: clue = the sentence's shape (type, tense, building
    // blocks, meaning in their language) → hintLevel 1 first/last word · 2
    // +second/second-last · 3 full (half XP). Everything comes from the server
    // so hidden words never reach the browser.
    // hintOpen controls the pop-up's visibility on its own — decoupled from
    // hintLevel so closing (✕ / No thanks / Got it) always hides the card,
    // even after the full sentence (hintLevel 3) has been revealed.
    const [wrongAttempts, setWrongAttempts] = useState(0);
    const [hintLevel, setHintLevel] = useState(0);
    const [hintOpen, setHintOpen] = useState(false);
    const [hint, setHint] = useState<V3JumbleHint | null>(null);
    const [clue, setClue] = useState<V3JumbleClue | null>(null);
    const [hintLoading, setHintLoading] = useState(false);

    const resetHints = useCallback(() => {
        setWrongAttempts(0);
        setHintLevel(0);
        setHintOpen(false);
        setHint(null);
        setClue(null);
        setHintLoading(false);
    }, []);

    const playSfx = useSfx(flags.juicy);
    // Latest play fn behind a ref so the arrive/complete effects below fire only
    // on their real trigger (question change / round end), not whenever
    // `playSfx`'s identity changes.
    const playSfxRef = useRef(playSfx);
    useEffect(() => {
        playSfxRef.current = playSfx;
    }, [playSfx]);

    // loadNextBatch is the single entry point for fetching a fresh round of
    // 6 questions. Called on mount AND when the user hits "Next round" on
    // the completion screen. The backend advances each difficulty's cursor
    // on every correct submit, so subsequent fetches naturally serve new
    // questions; if some were wrong, those return again (intentional —
    // gives the user another shot).
    const loadNextBatch = useCallback(async () => {
        if (!authReady) return;
        try {
            setLoading(true);
            const batch = await v3FetchJumbleBatch(v3AccessToken, difficulty);
            setSentences(batch.sentences);
            setCurrentIndex(0);
            setFinished(false);
            setStreak(0);
            setResetKey((k) => k + 1);
            resetHints();
            setError(null);
            setQuotaReached(false);
        } catch (err) {
            if (err instanceof QuotaReachedError) {
                // Free daily quota for this difficulty is used up — the global
                // Go-Pro prompt already fired; show the in-page switch-difficulty
                // state rather than a generic error.
                setQuotaReached(true);
                setError(null);
            } else {
                setQuotaReached(false);
                setError(err instanceof Error ? err.message : "Failed to load questions");
                console.error("Error fetching jumble batch:", err);
            }
        } finally {
            setLoading(false);
        }
    }, [authReady, v3AccessToken, difficulty, resetHints]);

    useEffect(() => {
        void loadNextBatch();
    }, [loadNextBatch]);

    const totalQuestions = sentences.length;
    const shuffledWords = sentences[currentIndex]?.shuffledWords || [];
    // For the progressive band, the current question's cyclical level (1..3).

    // Auto-launch the walkthrough once questions are on screen if either:
    //   (a) the URL carries ?tour=1 (deep-link from the "How to play" CTA), or
    //   (b) the player has never seen the tour on this browser.
    // The query param is stripped afterwards so a reload won't re-trigger.
    const tourFlag = searchParams?.get(JUMBLE_TOUR_QUERY);
    useEffect(() => {
        if (loading || !authReady || sentences.length === 0) return;
        const seen = storageSeen(JUMBLE_TOUR_SEEN_KEY);
        const shouldStart = tourFlag === "1" || !seen;
        if (!shouldStart) return;

        // Let the DOM paint the freshly-mounted anchors before highlighting.
        const t = setTimeout(() => startNextStep(JUMBLE_TOUR_NAME), 400);
        if (tourFlag === "1") {
            const params = new URLSearchParams(searchParams?.toString() ?? "");
            params.delete(JUMBLE_TOUR_QUERY);
            const qs = params.toString();
            router.replace(qs ? `/dashboard/jumble?${qs}` : "/dashboard/jumble", { scroll: false });
        }
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, authReady, sentences.length, tourFlag]);

    const handleStartTour = useCallback(() => {
        startNextStep(JUMBLE_TOUR_NAME);
    }, [startNextStep]);

    // Reset the per-question speed clock whenever the question changes.
    useEffect(() => {
        questionStartRef.current = Date.now();
    }, [currentIndex, resetKey]);

    // Railway audio: a fresh train rolls into the station on each new question.
    // Skip the very first mount — that train is just there, it didn't "arrive".
    const trainArrivedRef = useRef(false);
    useEffect(() => {
        if (!trainArrivedRef.current) {
            trainArrivedRef.current = true;
            return;
        }
        playSfxRef.current("arrive");
    }, [currentIndex]);

    // Round-complete fanfare.
    useEffect(() => {
        if (finished) playSfxRef.current("complete");
    }, [finished]);

    const goNext = () => {
        resetHints();
        if (currentIndex < totalQuestions - 1) {
            setCurrentIndex((i) => i + 1);
        } else {
            setFinished(true);
        }
    };

    // Surface the AI coach once the player has missed the current sentence 2
    // times, and re-open it on every further miss. hintLevel/hint persist in
    // state, so a re-open resumes from the last revealed level (offer → half 1
    // → half 2 → full) rather than starting over — "still stuck" picks up where
    // they left off.
    useEffect(() => {
        if (wrongAttempts >= 2) setHintOpen(true);
    }, [wrongAttempts]);

    // Fetch a server-computed hint for the current question. The server only
    // ever returns the revealed words (full sentence at level 3), so the
    // answer isn't exposed in the network response before the player asks.
    const fetchHint = useCallback(
        async (level: number) => {
            const cur = sentences[currentIndex];
            if (!cur || !authReady) return;
            setHintLoading(true);
            try {
                const h = await v3FetchJumbleHint(v3AccessToken, {
                    order: cur.sentenceId,
                    difficulty: cur.difficulty,
                    level,
                    base: cur.progressiveBase,
                    variant: cur.progressiveLevel,
                });
                setHint(h);
                setHintLevel(level);
            } catch (err) {
                console.error("Error fetching hint:", err);
                emitToast({ type: "error", title: "Hint unavailable", body: "Couldn't load a hint. Please try again." });
            } finally {
                setHintLoading(false);
            }
        },
        [sentences, currentIndex, authReady, v3AccessToken],
    );

    // First rung: the sentence's shape. Reveals no word positions.
    const fetchClue = useCallback(async () => {
        const cur = sentences[currentIndex];
        if (!cur || !authReady) return;
        setHintLoading(true);
        try {
            setClue(
                await v3FetchJumbleClue(v3AccessToken, {
                    order: cur.sentenceId,
                    difficulty: cur.difficulty,
                    base: cur.progressiveBase,
                    variant: cur.progressiveLevel,
                }),
            );
        } catch (err) {
            console.error("Error fetching clue:", err);
            emitToast({ type: "error", title: "Hint unavailable", body: "Couldn't load a hint. Please try again." });
        } finally {
            setHintLoading(false);
        }
    }, [sentences, currentIndex, authReady, v3AccessToken]);

    // 💡 on the board: open the ladder where the learner left it; the first
    // tap goes straight to the sentence's shape.
    const handleOpenHint = () => {
        setHintOpen(true);
        if (!clue && hintLevel === 0 && !hintLoading) void fetchClue();
    };

    const handleRequestHalf = () => fetchHint(Math.min(hintLevel + 1, 2));
    const handleRequestFull = () => fetchHint(3);
    const handleDismissHint = () => setHintOpen(false);

    const handleSubmit = async (userAnswer: string[]) => {
        if (!authReady) return;
        const currentSentenceData = sentences[currentIndex];
        if (!currentSentenceData) return;

        try {
            setSubmitting(true);
            const response = await v3SubmitJumbleAnswer(v3AccessToken, {
                    sentenceId: currentSentenceData.sentenceId,
                    difficulty: currentSentenceData.difficulty,
                    base: currentSentenceData.progressiveBase,
                    variant: currentSentenceData.progressiveLevel,
                    userAnswer,
                });
            // Trust the server's totals — keeps Redux in lockstep with
            // the DB and avoids any FE-side level threshold drift.
            // syncFromBackend updates both totalXP and currentLevel
            // atomically so the navbar/profile/Redux all flip together.
            dispatch(syncFromBackend({ totalXp: response.totalXp, currentLevel: response.currentLevel }));
            // Mirror the per-category combo into Redux. v1 returns
            // undefined here so we keep the local fallback (0). On v3
            // this is the authoritative value — backend incremented or
            // reset based on correct/wrong.
            if (typeof response.combo === "number") {
              dispatch(setCombo({ category: "jumble", value: response.combo }));
            }

            if (response.correct === false) {
                setFeedback("wrong");
                setStreak(0);
                setWrongAttempts((n) => n + 1);
                playSfx("wrong");
                // No toast — the SFX, feedback state, and (on train) the
                // derail animation are enough. Toasts are reserved for
                // badge awards now.
                // The train world needs longer — it races to the buffer, then derails.
                const wrongDelay = 1650;
                setTimeout(() => {
                    setFeedback(null);
                    setSubmitting(false);
                    setResetKey((k) => k + 1);
                }, wrongDelay);
            } else {
                const quick = (Date.now() - questionStartRef.current) / 1000 <= SPEED_LIMIT_SEC;
                const nextStreak = streak + 1;
                setStreak(nextStreak);
                setBestStreak((b) => Math.max(b, nextStreak));
                setFeedback("correct");
                setXpGain({ amount: response.xpEarned, quick });
                playSfx(nextStreak >= 3 ? "streak" : "correct");
                // Railway world: the buffer signal flips to green ("go") and the
                // train pulls out of the station — sync the audio to that beat.
                playSfx("signal");
                setTimeout(() => playSfx("depart"), 180);

                confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ["#b79fff", "#ab8eff", "#00e3fd", "#ff6c95"] });
                // No "correct" toast — the confetti + SFX + +XP float
                // animation already say "you got it right." Toasts are
                // reserved for badge awards and other rare events.

                // Diagnostic — surfaces why a celebration did or didn't
                // fire. Remove (or move behind a debug flag) once the
                // celebration triggers are visually confirmed.
                console.log("[jumble] submit response", {
                  totalXp: response.totalXp,
                  currentLevel: response.currentLevel,
                  leveledUp: response.leveledUp,
                  newlyEarnedBadges: response.newlyEarnedBadges,
                });

                // Level-up celebration — full-screen overlay + a
                // 3-burst gold confetti shower over ~1.2s. The overlay
                // auto-dismisses; the user can also click through.
                if (response.leveledUp) {
                  // A level-up shows its own full-screen card ALONE — badge
                  // celebrations are suppressed for this event (the backend
                  // already excludes lvl IDs from newlyEarnedBadges).
                  dispatch(triggerLevelUp(response.currentLevel));
                  const goldShower = () =>
                    confetti({
                      particleCount: 280,
                      spread: 140,
                      startVelocity: 60,
                      origin: { y: 0.5 },
                      colors: ["#ffd700", "#ffb347", "#ff9966", "#ffe082"],
                    });
                  setTimeout(goldShower, 200);
                  setTimeout(goldShower, 600);
                  setTimeout(goldShower, 1000);
                } else {
                  // Route each earned badge to its award mode (celebration /
                  // minimal toast / silent).
                  notifyBadgeAwards(dispatch, response.newlyEarnedBadges);
                  // Progressive set complete — the party-popper overlay fires
                  // EVERY time a set (easy → medium → hard) is cleared, not
                  // just on first earn. Skip when this submit also newly
                  // earned a progset badge (already queued above) so the
                  // player doesn't sit through two overlays.
                  if (
                    response.progressiveSetComplete &&
                    !(response.newlyEarnedBadges ?? []).some((id) => id.startsWith("progset:"))
                  ) {
                    dispatch(enqueueBadgeCelebrations(["progset:1"]));
                  }
                }
                setTimeout(() => {
                    confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0 } });
                    confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1 } });
                }, 250);
                setTimeout(() => setXpGain(null), 1150);
                setTimeout(() => {
                    setFeedback(null);
                    goNext();
                    setSubmitting(false);
                }, 1000);
            }
        } catch (err) {
            console.error("Error submitting answer:", err);
            setError(err instanceof Error ? err.message : "Failed to submit answer");
            emitToast({ type: "error", title: "Failed to submit", body: "Something went wrong please try again." });
            setSubmitting(false);
        }
    };

    const handleSkip = () => goNext();

    const handleSentenceChange = useCallback((words: string[]) => {
        setCurrentSentence(words);
    }, []);

    const handlePlaceSound = useCallback(() => playSfx("place"), [playSfx]);

    // Read the player's current arrangement aloud (Journey & Audio bundle).
    // Uses the shared TTS helper so it speaks in an Indian-English voice.
    const speakSentence = () => {
        if (typeof window === "undefined" || !window.speechSynthesis) return;
        const text = currentSentence.join(" ").trim();
        if (!text) {
            emitToast({ type: "info", title: "Nothing to read yet", body: "Place some words first, then tap the speaker." });
            return;
        }
        speak(text, { rate: 0.95 });
    };

    // Context-aware coach copy (Smart Coach bundle).
    const coachMessage = useMemo(() => {
        if (!flags.coach) {
            return "Take your time! You're doing great. Think about the meaning of the sentence.";
        }
        if (feedback === "wrong") {
            const cap = shuffledWords.find((w) => /^[A-Z]/.test(w));
            return cap
                ? `Not quite. English sentences open with a capitalized word — try starting with "${cap}".`
                : "Not quite — rearrange the words and watch the word order.";
        }
        if (feedback === "correct") {
            return streak >= 3 ? `${streak} in a row — unstoppable!` : "Beautifully done! Next one coming up.";
        }
        if (streak >= 3) return `You're on a ${streak}-question streak. Keep the momentum!`;
        return IDLE_TIPS[currentIndex % IDLE_TIPS.length];
    }, [flags.coach, feedback, streak, shuffledWords, currentIndex]);

    // Session still resolving → show the skeleton, never the login card.
    if (sessionLoading) {
        return <JumbleSkeleton />;
    }

    // authReady checks that the resolved NextAuth session has a valid token.
    if (!authReady) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center p-10 rounded-2xl c-box">
                    <div className="text-5xl mb-4">🔐</div>
                    <h2 className="text-2xl font-bold text-heading mb-2">Login Required</h2>
                    <p className="text-muted-foreground mb-6">
                        Please log in to access the jumble words quiz.
                    </p>
                    <button
                        onClick={() => router.push("/login")}
                        className="px-8 py-3 rounded-full bg-gradient-to-br from-[#b79fff] to-[#ab8eff] text-[#0b0e14] font-semibold hover:opacity-90 transition-all"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return <JumbleSkeleton />;
    }

    if (quotaReached) {
        const failed = difficulty.charAt(0) + difficulty.slice(1).toLowerCase();
        const remaining = remainingDifficulties("jumble").map((d) => d.charAt(0).toUpperCase() + d.slice(1));
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="max-w-md text-center p-10 rounded-2xl c-box">
                    <div className="text-5xl mb-4">🎯</div>
                    <h2 className="text-2xl font-bold text-heading mb-2">{failed} is done for today</h2>
                    <p className="text-muted-foreground mb-6">
                        {remaining.length > 0 ? (
                            <>
                                Pick another difficulty to keep practising — still free:{" "}
                                <span className="font-semibold text-heading">{remaining.join(", ")}</span>. Or go Pro for unlimited.
                            </>
                        ) : (
                            <>You&apos;ve used all your free rounds today — go Pro for unlimited play.</>
                        )}
                    </p>
                    <div className="mb-6 flex justify-center">
                        <DifficultyTabs value={difficulty} onChange={setDifficulty} disabled={loading} />
                    </div>
                    <button
                        onClick={() => router.push("/v3/premium")}
                        className="px-8 py-3 rounded-full bg-[#3f9d2c] text-white font-semibold hover:brightness-105 transition-all"
                    >
                        Go Pro for unlimited
                    </button>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center p-10 rounded-2xl c-box">
                    <div className="text-5xl mb-4">❌</div>
                    <h2 className="text-2xl font-bold text-pink mb-2">Error Loading Questions</h2>
                    <p className="text-muted-foreground mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-8 py-3 rounded-full bg-gradient-to-br from-[#b79fff] to-[#ab8eff] text-[#0b0e14] font-semibold hover:opacity-90 transition-all"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (finished) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center p-10 rounded-2xl c-box">
                    <div className="text-5xl mb-4">🎉</div>
                    <h2 className="text-2xl font-bold text-heading mb-2">Round complete!</h2>
                    <p className="text-muted-foreground mb-2">
                        Total XP so far:{" "}
                        <span className="font-semibold text-gradient">{totalXP} XP</span>
                    </p>
                    <p className="text-muted-foreground mb-4">
                        Best streak this round:{" "}
                        <span className="font-semibold text-cyan">{bestStreak} 🔥</span>
                    </p>
                    {/* Pick the difficulty for the next round before starting it. */}
                    <div className="mb-6 flex justify-center">
                        <DifficultyTabs
                            value={difficulty}
                            onChange={setDifficulty}
                            disabled={loading}
                        />
                    </div>
                    <div className="flex items-center justify-center gap-3">
                        <button
                            onClick={() => { void loadNextBatch(); }}
                            disabled={loading}
                            className="px-8 py-3 rounded-full bg-gradient-to-br from-[#b79fff] to-[#ab8eff] text-[#0b0e14] font-semibold hover:opacity-90 transition-all disabled:opacity-50"
                        >
                            {loading ? "Loading…" : "Next round"}
                        </button>
                        <button
                            onClick={() => router.push("/")}
                            className="px-6 py-3 rounded-full border border-white/[0.1] text-body hover:bg-surface-2/40 transition-colors"
                        >
                            Done for now
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Main layout ──────────────────────────────────────────────────────────

    return (
        // Bottom padding clears the fixed train band (the train world). On
        // phones the band is lifted above the bottom-nav island, so it needs
        // more clearance than on desktop.
        <div className="flex flex-col gap-3 pb-[calc(60px_+_env(safe-area-inset-bottom))] md:pb-[160px]">
            {/* Compact header — title and progress */}
            <div id="tour-title" className="flex flex-wrap items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Puzzle className="h-5 w-5" />
                </span>
                <h1 className="text-2xl font-bold text-heading">Jumble Words</h1>
                <span className="hidden text-sm text-muted-foreground md:inline">
                    · Question {currentIndex + 1} of {totalQuestions}
                </span>

                {/* Difficulty switcher — player picks the band; changing it
                    reloads a fresh round at that difficulty. */}
                <DifficultyTabs
                    value={difficulty}
                    onChange={setDifficulty}
                    disabled={loading || submitting}
                />

                {/* How-to-play replay trigger */}
                <button
                    id="tour-help-btn"
                    onClick={handleStartTour}
                    aria-label="Show how to play"
                    title="How to play"
                    className="ml-auto flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-surface-2 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-heading"
                >
                    <HelpCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">How to play</span>
                </button>
            </div>

            <div className="grid grid-cols-1 items-start gap-x-6 gap-y-4 lg:grid-cols-[minmax(0,1fr)_340px]">
                {/* ── Left Panel — the board ── */}
                <div className="c-box overflow-hidden rounded-2xl">
                    {/* One combined control row: progress journey · difficulty · timer · audio */}
                    <div id="tour-controlbar" className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-3 py-2 md:px-6">
                        <div className="min-w-[180px] flex-1">
                            {/* Progressive band: the journey shows the CURRENT set
                                only — Easy → Medium → Hard — driven by the current
                                question's variant; it resets when the next set starts. */}
                            <JourneyStepper
                                total={totalQuestions}
                                current={currentIndex}
                                stageVariant={difficulty === "PROGRESSIVE" ? sentences[currentIndex]?.progressiveLevel : undefined}
                            />
                        </div>
                        {/* Speed clock — hidden on phones, shown from tablet up */}
                        <div className="hidden md:flex">
                            <SpeedTimer
                                duration={30}
                                resetKey={`${currentIndex}-${resetKey}`}
                                paused={submitting}
                            />
                        </div>
                        <button
                            onClick={handleOpenHint}
                            disabled={loading || submitting || !sentences[currentIndex]}
                            aria-label="Get a hint"
                            title="Get a hint"
                            className="flex items-center gap-1 rounded-xl bg-surface-2 px-2 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-surface-3 disabled:opacity-50"
                        >
                            <Lightbulb className="h-4 w-4" />
                            <span className="hidden sm:inline">Hint</span>
                        </button>
                        <button
                            onClick={speakSentence}
                            aria-label="Hear your sentence"
                            title="Hear your sentence"
                            className="rounded-xl bg-surface-2 p-1.5 text-primary transition-colors hover:bg-surface-3"
                        >
                            <HiSpeakerWave className="text-base" />
                        </button>
                    </div>

                    {/* Prompt */}
                    <h2 className="px-3 pt-4 text-lg font-semibold text-heading sm:text-xl md:px-6">
                        Unjumble the words to make a correct English sentence.
                    </h2>

                    <WordDragDrop
                        key={resetKey}
                        shuffledWords={shuffledWords}
                        onSubmit={handleSubmit}
                        onSkip={handleSkip}
                        isSubmitting={submitting}
                        tapToPlace={flags.juicy}
                        feedback={flags.juicy ? feedback : null}
                        onSentenceChange={handleSentenceChange}
                        onPlaceSound={flags.juicy ? handlePlaceSound : undefined}
                    />
                </div>

                {/* ── Right Panel — side rail ── */}
                <div ref={glowRef} className="flex flex-col gap-4">
                    <ProgressStatsCard
                        id="tour-progress"
                        category="jumble"
                        dots={{ total: totalQuestions, current: currentIndex }}
                        xpGain={xpGain}
                        mobileCompact
                    />

                    {/* AI Coach Card — tablet/desktop only. On phones it's
                        replaced by the disposable <CoachFeedbackCard/> that pops
                        up on submit. (Kept in the DOM as the tour anchor.) */}
                    <div id="tour-coach" className="glass-glow hidden items-center gap-3 rounded-2xl p-4 md:flex">
                        <span
                            className={cn(
                                "mascot-ring",
                                feedback === "correct" && "mascot-ring--correct",
                                feedback === "wrong" && "mascot-ring--wrong",
                            )}
                        >
                            <AiCoachMascot feedback={feedback} size={64} />
                        </span>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 font-semibold text-heading">
                                AI Coach
                                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                                    Live
                                </span>
                            </div>
                            <div
                                className={cn(
                                    "mt-0.5 text-sm transition-colors",
                                    feedback === "wrong"
                                        ? "text-[#ef4444]"
                                        : feedback === "correct"
                                            ? "text-[#22c55e]"
                                            : "text-muted-foreground"
                                )}
                            >
                                {coachMessage}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {hintOpen && (
                <JumbleHintCard
                    misses={wrongAttempts}
                    hintLevel={hintLevel}
                    clue={clue}
                    hint={hint}
                    loading={hintLoading}
                    onRequestClue={fetchClue}
                    onRequestHalf={handleRequestHalf}
                    onRequestFull={handleRequestFull}
                    onDismiss={handleDismissHint}
                />
            )}

            {/* Phones only: the AI coach's happy/sad reaction on submit. Hidden
                while the hint card is up so the two never stack. */}
            {!hintOpen && <CoachFeedbackCard feedback={feedback} message={coachMessage} />}
        </div>
    );
}
