"use client";

// v3 AI partner UI. Identical surface to AIPartnerChatPage; only the
// hooks underneath are swapped (Cognito session + v3 chat WS + v3 STT
// token). Kept as a separate file so the v1 code is untouched.

import { useSession } from "@/lib/session";
import { storageSeen } from "@/lib/safeStorage";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { HelpCircle } from "lucide-react";
import { useNextStep } from "nextstepjs";
import { cn } from "@/lib/utils";
import {
  AI_PARTNER_TOUR_NAME,
  AI_PARTNER_TOUR_QUERY,
  AI_PARTNER_TOUR_SEEN_KEY,
} from "./aiPartnerTour";
import { fromSessionUser } from "@/lib/displayUser";
import VoiceAgent from "./voiceAgent/VoiceAgent";
import { detectEmotion, type MascotEmotion } from "@/lib/emotion";
import { useSfx, type SfxCue } from "@/hooks/useSfx";
import MicLevelRing from "./voiceAgent/MicLevelRing";
import { stateColor, type AgentState } from "./voiceAgent/agentConfig";
import {
  FaFlag,
  FaHourglassHalf,
  FaMicrophone,
  FaMicrophoneSlash,
  FaRobot,
} from "react-icons/fa6";
import { FiAlertCircle, FiClock } from "react-icons/fi";

import { useGeminiLiveSession } from "@/hooks/useGeminiLiveSession";
import { v3FetchAIUsage, type V3AIUsage } from "@/lib/v3Chat";
import { ChatBubble } from "./ChatBubble";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import { PixelMascot } from "@/components/v3/PixelMascot";
import { SolveCelebration } from "@/components/v3/SolveCelebration";

import { SpeechProgressCard } from "./aiPartner/SpeechProgressCard";
import SessionSetup, {
  defaultSetup,
  loadSavedSetup,
  saveSetup,
  setupSummary,
  type SessionSetupValue,
} from "./aiPartner/SessionSetup";

// Fallback session length used until the per-session rewards config
// arrives. Admin can tune the real value via /v3/admin/ai-partner.
const DEFAULT_TOTAL_SECONDS = 10 * 60;

const TIPS = [
  {
    title: "Speak naturally",
    body: "Don't worry about mistakes. I'm here to help you improve.",
    icon: FaRobot,
  },
  {
    title: "Short & clear is great",
    body: "Keep your answers simple and to the point.",
    icon: FiClock,
  },
  {
    title: "Take your time",
    body: "Think before you speak. Fluency comes with practice.",
    icon: FaHourglassHalf,
  },
  {
    title: "Report any issues",
    body: "Help us improve your experience.",
    icon: FaFlag,
  },
];

// Start-card tiles. The XP copy is built from the admin's reward config
// (returned by /chat/usage) so it can never drift from what's awarded.
function buildInstructions(rewards: V3AIUsage["rewards"]) {
  const everyMin = rewards ? Math.max(1, Math.round(rewards.recurringIntervalSeconds / 60)) : 1;
  const earnBody = rewards
    ? `+${rewards.thresholdXp} XP after ${rewards.thresholdSeconds}s of talking, then +${rewards.recurringXp} XP every ${
        rewards.recurringIntervalSeconds % 60 === 0 ? `${everyMin} min` : `${rewards.recurringIntervalSeconds}s`
      } you speak.`
    : "Earn XP for every minute you spend speaking.";
  return [
    {
      icon: FaMicrophone,
      title: "Just talk",
      body: "No buttons — speak naturally and K.AI answers when you pause. Talk over it any time to interrupt. Tap the mic to mute.",
    },
    { icon: FaHourglassHalf, title: "Earn as you speak", body: earnBody },
    {
      icon: FaRobot,
      title: "Free-flowing",
      body: "There's no script. Talk about anything — K.AI follows your lead.",
    },
    // The 4th tile is rendered dynamically in the start card — it shows the
    // remaining AI-Partner time for the current window (see the usage fetch).
  ];
}

// Each mascot mood maps onto one of three short cues: an upbeat lift for
// positive replies, a gentle fall for tender ones, a soft tick otherwise.
const EMOTION_SFX: Record<MascotEmotion, SfxCue> = {
  happy: "cheer",
  love: "cheer",
  surprised: "cheer",
  idea: "cheer",
  tips: "cheer",
  greeting: "cheer",
  sad: "aww",
  scared: "aww",
  confused: "aww",
  angry: "aww",
  conversing: "blip",
  asking: "blip",
  thinking: "blip",
  idle: "blip",
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// Friendly "N min" for the remaining-time chip on the start card. Rounds up so a
// sliver of time still reads as "1 min" rather than "0 min".
function formatMinutesLeft(seconds: number) {
  const mins = Math.max(0, Math.ceil(seconds / 60));
  return `${mins} min`;
}

function getMotivation(secondsLeft: number, total: number): { label: string; sub: string } {
  if (secondsLeft === 0) return { label: "Session complete! 🎉", sub: "Great job today." };
  const ratio = total > 0 ? secondsLeft / total : 0;
  if (ratio > 0.66) return { label: "Keep going! 💪", sub: "You're doing great." };
  if (ratio > 0.33) return { label: "Almost halfway! 🔥", sub: "Stay focused." };
  return { label: "Last stretch! ⚡", sub: "Finish strong." };
}

export default function V3AIPartner({ nativeLanguage }: { nativeLanguage?: string }) {
  const { data: session } = useSession();
  const user = fromSessionUser(session?.user);
  const accessToken = session?.user?.accessToken ?? null;
  // The user's profile native language (source of truth for the per-
  // session picker default). Falls back to English when not yet set.
  const profileLang = nativeLanguage ?? session?.user?.nativeLang ?? "English";

  // Session setup (language K.AI mixes with English, level, practice mode,
  // voice) — like ENGAI's controls. Until the learner changes something the
  // defaults follow their profile language; their last choice is remembered
  // on this device. Baked into the Gemini token at session start.
  const [savedSetup, setSavedSetup] = useState<SessionSetupValue | null>(() => loadSavedSetup());
  const setup = savedSetup ?? defaultSetup(profileLang);
  const updateSetup = (v: SessionSetupValue) => {
    setSavedSetup(v);
    saveSetup(v);
  };
  const lang = setup.language;
  const langLabel = lang === "English" ? "English" : `${lang} + English`;

  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_TOTAL_SECONDS);
  const [started, setStarted] = useState(false);
  // AI-Partner time usage for the current window (Pro: daily, free: weekly),
  // fetched before a session starts so the start card can show "X min left".
  const [usage, setUsage] = useState<V3AIUsage | null>(null);
  // Set true once the user acknowledges the "session ended" notice — hides the
  // blocking overlay while everything stays frozen until they restart.
  const [endedAck, setEndedAck] = useState(false);
  // Index of the single "Tips from K.AI" card shown; rotates every 10s.
  const [tipIndex, setTipIndex] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  // Onboarding is asked-again on /ai-partner if it wasn't completed
  // — but the user can choose to skip and just chat. The skip lives
  // in component-local state so navigating away and back re-asks.
  const [onboardingSkipped, setOnboardingSkipped] = useState(false);
  const needsOnboarding =
    session?.user?.onboardingCompleted === false && !onboardingSkipped;
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spaceDownRef = useRef(false);
  const lastCelebratedRef = useRef(0);
  // How long the current session is allowed to run — the REMAINING window time
  // (cap − already-used) when capped, so one session flows continuously up to
  // the daily/weekly cap rather than a fixed 10-minute block. secondsLeft counts
  // down from this. Set at handleStart; falls back to the session length when
  // there's no cap configured. State (not a ref) so it can be read during render.
  const [sessionBudget, setSessionBudget] = useState(DEFAULT_TOTAL_SECONDS);

  const displayName = user?.displayName?.trim() || "User";
  const avatarInitial = displayName.charAt(0).toUpperCase();
  const isSessionEnded = secondsLeft === 0;

  const {
    messages,
    isAiTyping,
    isConnected,
    error: chatError,
    close: closeChat,
    primeAudio,
    streamingMessageId,
    speechProgress,
    rewards,
    aiUsedSeconds,
    aiCapSeconds,
    aiLimitReached,
    isAiSpeaking,
    // Hands-free mic (D-039): opens by itself when the call connects, Gemini's
    // voice detection takes the turns, the learner can only mute/unmute.
    mic,
  } = useGeminiLiveSession({
    enabled: started && !isSessionEnded,
    accessToken,
    nativeLanguage: lang,
    level: setup.level,
    scenario: setup.scenario,
    voice: setup.voice,
  });

  // Total session length comes from the admin-configured rewards.
  // useMemo (not state) so it's derived purely from the rewards prop —
  // no setState-in-effect cascade. secondsLeft is the ticking counter;
  // it's initialised on handleStart so a late-arriving rewards config
  // can't retroactively change a running session's deadline.
  const totalSeconds = useMemo(
    () =>
      rewards?.sessionSeconds && rewards.sessionSeconds > 0
        ? rewards.sessionSeconds
        : DEFAULT_TOTAL_SECONDS,
    [rewards],
  );

  const motivation = getMotivation(secondsLeft, totalSeconds);
  const isMicActive = mic.open && !mic.muted;
  const toggleMute = mic.toggleMute;

  // ── Daily/weekly AI-time cap ─────────────────────────────────────────
  // Cap + already-used seconds for the in-session timer. Prefer the `usage`
  // snapshot — the SAME source the start card's "X min left" uses — so the
  // in-session timer can never disagree with the number the user just saw on
  // the previous screen. Fall back to the create-session response only when
  // usage didn't load. Without this, a create response reporting 0 used-seconds
  // (a transient before it lands, a window roll-over, or a stale read) would
  // reset the timer to the full cap — the "back to a full allowance" bug — even
  // though minutes were already spent this window.
  const capSecondsEff = usage?.capSeconds ?? aiCapSeconds;
  const usedSecondsBase = usage?.usedSeconds ?? aiUsedSeconds;
  // elapsedSeconds is this session's wall-clock so far (counted down from the
  // session budget = remaining window). The window figure counts UP from what
  // was already used before this session, capped at the allowance.
  const elapsedSeconds = started ? Math.max(0, sessionBudget - secondsLeft) : 0;
  const hasDailyCap = capSecondsEff > 0;
  const dailyUsedLive = hasDailyCap
    ? Math.min(capSecondsEff, usedSecondsBase + elapsedSeconds)
    : usedSecondsBase + elapsedSeconds;
  const dailyCapHit = hasDailyCap && usedSecondsBase + elapsedSeconds >= capSecondsEff;
  // The session ends when the budget runs out OR the cap is hit OR the server
  // closed the socket at the cap.
  const sessionOver = isSessionEnded || dailyCapHit || aiLimitReached;
  // capReached: the whole window allowance is spent. When capped, running the
  // budget to zero IS the cap — so a per-session end counts as the cap too (no
  // "start a fresh session" for capped users; the window just resets tomorrow/
  // next week). Only the uncapped fallback shows the plain per-session end.
  const capReached =
    dailyCapHit || aiLimitReached || (hasDailyCap && isSessionEnded);
  // Headline timer on the chat page: "used / cap" for the window when capped,
  // else the plain per-session countdown.
  const timerUsed = hasDailyCap ? dailyUsedLive : totalSeconds - secondsLeft;
  const timerTotal = hasDailyCap ? capSecondsEff : totalSeconds;
  const timerProgressPercent = (timerUsed / Math.max(1, timerTotal)) * 100;

  // "speaking" now reflects real audio playback (PcmPlayer), not the thinking
  // gap; the thinking gap gets its own label below.
  const agentState: AgentState = isAiSpeaking || isAiTyping
    ? "speaking"
    : isMicActive
      ? "listening"
      : "idle";
  const agentLabel = isAiSpeaking
    ? "Speaking…"
    : isAiTyping
      ? "Thinking…"
      : mic.muted
        ? "Muted"
        : isMicActive
          ? "Listening…"
          : "Connecting…";

  // Mascot mood: engaged while the user speaks, otherwise it reflects the
  // mood of K.AI's latest reply (cheap keyword detection). Thinking is shown
  // via isThinking below.
  const lastAssistantText = useMemo(
    () => [...messages].reverse().find((m) => m.role === "assistant")?.body ?? "",
    [messages],
  );
  const mascotEmotion: MascotEmotion = mic.transcript
    ? "asking"
    : detectEmotion(lastAssistantText, "conversing");

  // Give the mascot's mood a voice: play a short cue once each K.AI reply has
  // finished streaming, picked from the emotion detected in its full text.
  const playSfx = useSfx(true);
  const lastSpokenMsgIdRef = useRef<string | null>(null);
  useEffect(() => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    if (!lastAssistant) return;
    // Hold until the bubble is done streaming so we read its final mood, and
    // never re-sound a message we've already voiced.
    if (lastAssistant.id === streamingMessageId) return;
    if (lastAssistant.id === lastSpokenMsgIdRef.current) return;
    lastSpokenMsgIdRef.current = lastAssistant.id;
    playSfx(EMOTION_SFX[detectEmotion(lastAssistant.body)]);
  }, [messages, streamingMessageId, playSfx]);

  useEffect(() => {
    if (!started) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [started]);

  // Fallback reconciliation for when the pre-start usage fetch was MISSING.
  // Normally handleStart already set the countdown to the true remaining window
  // (usage.remainingSeconds), so the create-session response is only needed when
  // usage never loaded. Re-snapping from that response when usage IS present is
  // not just redundant — if the response reports 0 used-seconds it resets the
  // countdown to the FULL cap, wiping the minutes already spent (the "back to 20
  // minutes" bug). So only reconcile here when we had no usage snapshot to seed
  // from.
  const reconciledRef = useRef(false);
  useEffect(() => {
    if (!started) {
      reconciledRef.current = false;
      return;
    }
    if (usage) return;
    if (reconciledRef.current || aiCapSeconds <= 0) return;
    reconciledRef.current = true;
    const remaining = Math.max(0, aiCapSeconds - aiUsedSeconds);
    setSessionBudget(remaining);
    setSecondsLeft(remaining);
  }, [started, aiCapSeconds, aiUsedSeconds, usage]);

  // Rotate the single K.AI tip every 10 seconds.
  useEffect(() => {
    const id = setInterval(() => setTipIndex((i) => (i + 1) % TIPS.length), 10_000);
    return () => clearInterval(id);
  }, []);

  // Fetch remaining AI time whenever we're on the start card (not in a session),
  // so "X min left" is current — including right after a session ends.
  useEffect(() => {
    if (!accessToken || started) return;
    let cancelled = false;
    v3FetchAIUsage(accessToken)
      .then((u) => {
        if (!cancelled) setUsage(u);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [accessToken, started]);

  // sessionBudget: how long this session may run. When capped, it's the whole
  // remaining window (so one continuous session flows up to the daily/weekly
  // cap); otherwise the plain session length.
  const computeSessionBudget = () =>
    usage && usage.capSeconds > 0 ? Math.max(0, usage.remainingSeconds) : totalSeconds;

  const handleStart = () => {
    primeAudio();
    // Snap the countdown to the remaining window at the moment the user starts.
    // After this, a late-arriving rewards/usage change won't disturb the run.
    setEndedAck(false);
    const budget = computeSessionBudget();
    setSessionBudget(budget);
    setSecondsLeft(budget);
    setStarted(true);
  };

  const handleRetry = () => {
    primeAudio();
    setEndedAck(false);
    setStarted(false);
    setTimeout(() => {
      const budget = computeSessionBudget();
      setSessionBudget(budget);
      setSecondsLeft(budget);
      setStarted(true);
    }, 0);
  };

  // Keep the chat pinned to the latest message. Scroll the CHAT CONTAINER's own
  // scrollTop — never scrollIntoView, which bubbles up and scrolls the whole page
  // (dragging the mic card up, and jumping the page when the greeting lands during
  // the onboarding tour).
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isAiTyping]);

  useEffect(() => {
    if (sessionOver) closeChat(); // also releases the mic
  }, [sessionOver, closeChat]);

  // Fire celebration on each fresh milestone — lastMilestoneId is bumped
  // by the WS event handler exactly once per crossed boundary.
  useEffect(() => {
    if (speechProgress.lastMilestoneId === 0) return;
    if (speechProgress.lastMilestoneId === lastCelebratedRef.current) return;
    lastCelebratedRef.current = speechProgress.lastMilestoneId;
    // On a level-up the app-wide LevelUpCelebration card takes over, so skip
    // the lighter per-milestone SolveCelebration to avoid two overlays at once.
    if (speechProgress.lastLeveledUp) return;
    setCelebrating(true);
  }, [speechProgress.lastMilestoneId]);

  // Keyboard: Space mutes / unmutes (the conversation itself is hands-free).
  useEffect(() => {
    if (!started || sessionOver) return;
    const isTyping = (t: EventTarget | null) => {
      const el = t as HTMLElement | null;
      return (
        !!el &&
        (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)
      );
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !isTyping(e.target)) {
        e.preventDefault();
        if (spaceDownRef.current) return; // ignore key-repeat
        spaceDownRef.current = true;
        toggleMute();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        spaceDownRef.current = false;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [started, sessionOver, toggleMute]);

  // ── How-to-play walkthrough ──────────────────────────────────────────
  // The tour highlights elements that only exist in the active session
  // view (agent header, chat, mic), so it auto-launches once the session
  // has started — on first visit, or whenever the URL carries ?tour=1.
  const router = useRouter();
  const searchParams = useSearchParams();
  const { startNextStep } = useNextStep();
  const tourFlag = searchParams?.get(AI_PARTNER_TOUR_QUERY);

  useEffect(() => {
    if (!started) return;
    const seen = storageSeen(AI_PARTNER_TOUR_SEEN_KEY);
    const shouldStart = tourFlag === "1" || !seen;
    if (!shouldStart) return;

    // Let the active-session anchors paint before highlighting them.
    const t = setTimeout(() => startNextStep(AI_PARTNER_TOUR_NAME), 500);
    if (tourFlag === "1") {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.delete(AI_PARTNER_TOUR_QUERY);
      const qs = params.toString();
      router.replace(qs ? `/dashboard/ai-partner?${qs}` : "/dashboard/ai-partner", {
        scroll: false,
      });
    }
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, tourFlag]);

  const handleStartTour = useCallback(() => {
    startNextStep(AI_PARTNER_TOUR_NAME);
  }, [startNextStep]);

  if (!started && needsOnboarding) {
    return (
      <div className="flex min-h-[calc(100dvh-10rem)] items-center justify-center py-6">
        <OnboardingWizard
          onComplete={() => setOnboardingSkipped(true)}
          onSkip={() => setOnboardingSkipped(true)}
          eyebrowOverride="Before you meet K.AI"
        />
      </div>
    );
  }

  if (!started) {
    return (
      <div className="flex min-h-[calc(100dvh-10rem)] items-center justify-center py-3">
        <div className="c-box w-full max-w-2xl rounded-2xl px-6 py-6 text-center sm:px-12 sm:py-7">
          {/* Mascot + intro copy side by side on EVERY view (mascot left, text
              adjacent). The mascot scales down on phones (!w/!h override the
              component's inline size) so the row fits a narrow screen. */}
          <div className="mb-5 flex flex-row items-center justify-center gap-4 text-left sm:gap-7">
            <div className="anim-bubble-bob shrink-0">
              <PixelMascot emotion="greeting" size={144} className="!h-24 !w-24 sm:!h-36 sm:!w-36" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                AI Partner
              </p>
              <h1 className="mt-1 text-2xl font-bold text-gradient sm:mt-2 sm:text-4xl">Meet K.AI</h1>
              <p className="mt-2 max-w-md text-[13px] leading-5 text-muted-foreground sm:mt-3 sm:text-[14px] sm:leading-6">
                Your personal AI partner for spoken English. Have a real,
                judgement-free conversation — K.AI listens, replies, and helps you
                improve as you go.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2.5 text-left">
            {buildInstructions(usage?.rewards).map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-surface-2/40 px-3 py-2.5 sm:items-start sm:gap-3 sm:px-4 sm:py-3"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary sm:h-9 sm:w-9">
                    <Icon className="text-[15px] sm:text-[16px]" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-heading">{item.title}</p>
                    {/* Sub-text is hidden on phones to keep the whole card on one
                        screen; shown from sm upward. */}
                    <p className="mt-0.5 hidden text-[12px] leading-5 text-muted-foreground sm:block">
                      {item.body}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* 4th tile: remaining AI-Partner time for the current window
                (Pro: daily, free: weekly). Replaces the old static "10 minutes"
                tile — this is the "good place to show" the remaining time. */}
            <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-surface-2/40 px-3 py-2.5 sm:items-start sm:gap-3 sm:px-4 sm:py-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary sm:h-9 sm:w-9">
                <FiClock className="text-[15px] sm:text-[16px]" />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-heading">
                  {usage
                    ? usage.capSeconds > 0
                      ? `${formatMinutesLeft(usage.remainingSeconds)} left ${usage.pro ? "today" : "this week"}`
                      : "Unlimited time"
                    : "Your time"}
                </p>
                <p className="mt-0.5 hidden text-[12px] leading-5 text-muted-foreground sm:block">
                  {usage
                    ? usage.capSeconds > 0
                      ? `Out of ${formatMinutesLeft(usage.capSeconds)} — resets ${usage.pro ? "daily" : "weekly"}.`
                      : "You're Pro — practise as long as you like."
                    : "Checking your remaining time…"}
                </p>
              </div>
            </div>
          </div>

          {/* Session setup: language, level, practice mode, voice. */}
          <SessionSetup value={setup} onChange={updateSetup} profileLang={profileLang} />

          {usage && usage.capSeconds > 0 && usage.remainingSeconds <= 0 ? (
            // Window spent — block the start and point free users to Pro.
            <div className="mt-6 flex flex-col items-center gap-2">
              <p className="text-[13px] font-bold text-heading">
                You&apos;ve used your AI Partner time for {usage.pro ? "today" : "this week"}.
              </p>
              {usage.pro ? (
                <p className="text-[12px] text-muted-foreground">
                  Come back tomorrow for more practice with K.AI.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => router.push("/v3/premium")}
                  className="mt-1 inline-flex items-center gap-2 rounded-full bg-[#3f9d2c] px-8 py-3 text-[14px] font-bold text-white shadow-lg transition hover:brightness-105 active:scale-[0.98]"
                >
                  Go Pro for 20 min / day
                </button>
              )}
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={handleStart}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-primary-1 to-primary-2 px-10 py-3.5 text-[15px] font-bold text-primary-foreground shadow-[0_14px_38px_-8px_rgba(15,23,42,0.6)] transition hover:opacity-90 active:scale-[0.98]"
              >
                ▶ Start session
              </button>
              <p className="mt-2 text-[12px] text-muted-foreground">
                {usage && usage.capSeconds > 0
                  ? `${formatMinutesLeft(usage.remainingSeconds)} left ${usage.pro ? "today" : "this week"} · ${langLabel}`
                  : `${Math.round((usage?.rewards?.sessionSeconds ?? DEFAULT_TOTAL_SECONDS) / 60)}-minute session · ${langLabel}`}
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Mobile: fixed to the viewport (cancel AppShell's pb-28 with -mb-28; size for
  // navbar + bottom-nav + safe-area, leaving a thin gap) so the PAGE never scrolls
  // — only the chat does. Desktop keeps its own fixed height.
  return (
    <div className="-mb-28 flex h-[calc(100dvh_-_9.75rem_-_env(safe-area-inset-bottom))] flex-col overflow-hidden md:mb-0 md:h-[calc(100dvh-10rem)] md:min-h-[520px]">
      <SolveCelebration
        visible={celebrating}
        xpEarned={speechProgress.lastXpEarned}
        headline={
          speechProgress.lastLeveledUp
            ? `Level up! Now level ${speechProgress.currentLevel}`
            : "Keep speaking!"
        }
        sublabel={`You've earned ${
          speechProgress.milestonesAwarded === 0
            ? 0
            : speechProgress.thresholdXp +
              Math.max(0, speechProgress.milestonesAwarded - 1) * speechProgress.recurringXp
        } XP in this session so far.`}
        onDone={() => setCelebrating(false)}
      />

      {/* Compact header — title and the how-to-play replay trigger.
          Mirrors Jumble Words. */}
      <div id="aip-tour-title" className="mb-2 flex shrink-0 flex-wrap items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <FaRobot className="h-4 w-4" />
        </span>
        <h1 className="text-2xl font-bold text-heading">AI Partner</h1>

        {/* Current setup + a way back to the setup card (settings are baked
            into this conversation, so changing them starts a new one). */}
        <span className="hidden min-w-0 truncate rounded-full border border-white/[0.06] bg-surface-2/60 px-3 py-1 text-[11px] font-semibold text-muted-foreground lg:inline">
          {setupSummary(setup)}
        </span>
        <button
          type="button"
          onClick={() => {
            setEndedAck(false);
            setStarted(false);
          }}
          title="Change language, mode or voice (starts a new conversation)"
          className="rounded-full border border-white/[0.06] bg-surface-2 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-heading"
        >
          Change setup
        </button>

        <button
          id="aip-tour-help-btn"
          onClick={handleStartTour}
          aria-label="Show how to play"
          title="How to play"
          className="ml-auto flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-surface-2 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-heading"
        >
          <HelpCircle className="h-4 w-4" />
          <span className="hidden sm:inline">How to play</span>
        </button>
      </div>

      <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden text-body">

        {/* Session-ended overlay — blocks the whole session until acknowledged.
            Everything is already stopped (WS closed, mic + audio halted); this is
            the explicit, prominent notice + restart. Dismiss ("Got it") leaves the
            UI frozen with a restart/quota prompt in the mic bar below. */}
        {sessionOver && !endedAck && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#0b0e14]/80 p-4 backdrop-blur-sm">
            {capReached ? (
              // Window allowance spent (daily for Pro, weekly for free): no new
              // session is possible — free users get the upgrade nudge.
              <div className="c-box w-full max-w-sm rounded-2xl border border-primary/40 p-6 text-center">
                <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-primary/15 text-primary">
                  <FaHourglassHalf className="text-[24px]" />
                </div>
                <h2 className="text-lg font-bold text-heading">
                  That&apos;s your K.AI time for {usage?.pro === false ? "this week" : "today"}
                </h2>
                <p className="mt-2 text-[13px] leading-5 text-muted-foreground">
                  You&apos;ve used all your AI Partner time{" "}
                  {usage?.pro === false ? "this week" : "today"}. K.AI has stopped —
                  no more replies or recording.
                </p>
                <div className="mt-5 flex flex-col gap-2">
                  {usage?.pro === false && (
                    <button
                      type="button"
                      onClick={() => router.push("/v3/premium")}
                      className="rounded-full bg-[#3f9d2c] px-5 py-2.5 text-[14px] font-bold text-white transition hover:brightness-105 active:scale-[0.98]"
                    >
                      Go Pro for 20 min / day
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setEndedAck(true)}
                    className="rounded-full px-5 py-2 text-[13px] font-semibold text-muted-foreground transition hover:text-heading"
                  >
                    Got it
                  </button>
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground">
                  Resets {usage?.pro === false ? "next week" : "tomorrow"}.
                </p>
              </div>
            ) : (
              // Per-session 10-minute timeout, but the window still has time —
              // the user can start a fresh session.
              <div className="c-box w-full max-w-sm rounded-2xl border border-destructive/40 p-6 text-center">
                <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-destructive/15 text-destructive">
                  <FaHourglassHalf className="text-[24px]" />
                </div>
                <h2 className="text-lg font-bold text-destructive">Session ended</h2>
                <p className="mt-2 text-[13px] leading-5 text-muted-foreground">
                  Your {formatTime(totalSeconds)} session is over. K.AI has stopped —
                  no more replies or recording.
                </p>
                <div className="mt-5 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="rounded-full bg-gradient-to-br from-primary-1 to-primary-2 px-5 py-2.5 text-[14px] font-bold text-primary-foreground transition hover:opacity-90 active:scale-[0.98]"
                  >
                    Start a new session
                  </button>
                  <button
                    type="button"
                    onClick={() => setEndedAck(true)}
                    className="rounded-full px-5 py-2 text-[13px] font-semibold text-muted-foreground transition hover:text-heading"
                  >
                    Got it
                  </button>
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground">
                  Need more time? Start a fresh session.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="relative flex h-full w-full flex-1 flex-col gap-2.5">

          <div className="flex min-h-0 flex-1 grid-cols-1 flex-col gap-2.5 xl:grid xl:grid-cols-[minmax(0,1fr)_340px]">

            <section className="flex flex-1 min-h-0 flex-col gap-2.5">

              {/* Slim status bar: status + timer + thin progress. The mascot and
                  Pixel/Orb toggle now live in the "Speak to earn" card. */}
              <div id="aip-tour-agent" className="c-box shrink-0 rounded-xl px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex min-w-0 items-center gap-1.5 text-[13px] font-semibold text-heading">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{
                        background: stateColor(agentState),
                        boxShadow: `0 0 8px ${stateColor(agentState)}`,
                      }}
                    />
                    <span className="truncate">{agentLabel}</span>
                  </span>

                  <div className="ml-auto flex shrink-0 items-center gap-2">
                    {/* Headline timer: when capped, the window total counts UP
                        ("used / cap today"); otherwise the per-session countdown. */}
                    <span className="inline-flex items-baseline gap-1">
                      <FaHourglassHalf
                        className={cn(
                          "self-center text-[12px]",
                          sessionOver ? "text-muted-foreground" : "text-primary"
                        )}
                      />
                      <span
                        className={cn(
                          "text-[16px] font-extrabold leading-none tracking-[-0.04em]",
                          sessionOver ? "text-muted-foreground" : "text-heading"
                        )}
                      >
                        {formatTime(timerUsed)}
                      </span>
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        / {formatTime(timerTotal)}
                        {hasDailyCap ? (usage?.pro === false ? " this week" : " today") : ""}
                      </span>
                    </span>

                    <span className="hidden text-[11px] font-semibold text-muted-foreground md:inline">
                      {motivation.label}
                    </span>
                  </div>
                </div>

                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3">
                  <div
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-1000",
                      sessionOver
                        ? "bg-surface-3"
                        : "bg-gradient-to-r from-primary-1 to-primary-2"
                    )}
                    style={{ width: `${timerProgressPercent}%` }}
                  />
                </div>
              </div>

              {/* Compact stats on phones/tablet — the full card (with mascot)
                  lives in the xl side-rail. */}
              {accessToken && (
                <div className="shrink-0 xl:hidden">
                  <SpeechProgressCard
                    compact
                    totalSeconds={speechProgress.totalSeconds}
                    milestonesAwarded={speechProgress.milestonesAwarded}
                    thresholdSeconds={speechProgress.thresholdSeconds}
                    thresholdXp={speechProgress.thresholdXp}
                    recurringInterval={speechProgress.recurringInterval}
                    recurringXp={speechProgress.recurringXp}
                    nextMilestoneAt={speechProgress.nextMilestoneAt}
                    nextMilestoneXp={speechProgress.nextMilestoneXp}
                  />
                </div>
              )}

              <div
                id="aip-tour-messages"
                ref={messagesContainerRef}
                className="min-h-0 flex-1 overflow-y-auto"
              >
                <div className="flex flex-col gap-4 py-1 pr-1">

                  {messages.length === 0 && !isAiTyping && (
                    chatError ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-destructive/10 text-destructive">
                          <FiAlertCircle className="text-[28px]" />
                        </div>
                        <p className="text-[14px] font-semibold text-destructive">
                          Connection failed
                        </p>
                        <p className="mt-2 max-w-xs text-[13px] leading-5 text-muted-foreground">
                          {chatError}
                        </p>
                        <button
                          type="button"
                          onClick={handleRetry}
                          className="mt-5 rounded-full bg-gradient-to-br from-primary-1 to-primary-2 px-5 py-2.5 text-[13px] font-bold text-primary-foreground shadow-[0_6px_18px_rgba(15,23,42,0.22)] transition hover:opacity-90 active:scale-[0.98]"
                        >
                          Try again
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
                          <FaRobot className="text-[28px]" />
                        </div>
                        <p className="text-[14px] font-semibold text-muted-foreground">
                          {started ? "K.AI is ready to chat" : "Press Start session when you're ready"}
                        </p>
                        <p className="mt-1 text-[13px] text-muted-foreground">
                          {started ? "Your session will begin shortly…" : "Kanchan will greet you the moment you start."}
                        </p>
                      </div>
                    )
                  )}

                  {messages.map((message) => (
                    <ChatBubble
                      key={message.id}
                      message={message}
                      userAvatar={user?.photoURL}
                      userInitial={avatarInitial}
                      isStreaming={message.id === streamingMessageId}
                    />
                  ))}

                  {isAiTyping && <TypingIndicator />}
                </div>
              </div>

              {(chatError || mic.error) && (
                <div className="shrink-0 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2 text-[13px] text-destructive">
                  {chatError || mic.error}
                </div>
              )}

              <div id="aip-tour-mic" className="c-box shrink-0 rounded-2xl p-3">
                {sessionOver ? (
                  capReached ? (
                    /* Window spent — no restart. Free users get the upgrade path. */
                    <div className="flex flex-col items-center gap-2 py-1 text-center sm:flex-row sm:justify-between sm:text-left">
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-heading">
                          That&apos;s your K.AI time for {usage?.pro === false ? "this week" : "today"}
                        </p>
                        <p className="text-[12px] text-muted-foreground">
                          Resets {usage?.pro === false ? "next week" : "tomorrow"}.
                          {usage?.pro === false ? " Go Pro for 20 min / day." : ""}
                        </p>
                      </div>
                      {usage?.pro === false && (
                        <button
                          type="button"
                          onClick={() => router.push("/v3/premium")}
                          className="shrink-0 rounded-full bg-[#3f9d2c] px-5 py-2.5 text-[13px] font-bold text-white shadow-[0_6px_18px_rgba(15,23,42,0.22)] transition hover:brightness-105 active:scale-[0.98]"
                        >
                          Go Pro
                        </button>
                      )}
                    </div>
                  ) : (
                    /* Per-session timeout, window still has time — start again. */
                    <div className="flex flex-col items-center gap-2 py-1 text-center sm:flex-row sm:justify-between sm:text-left">
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-destructive">Session ended</p>
                        <p className="text-[12px] text-muted-foreground">
                          Start a new session to keep practising.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRetry}
                        className="shrink-0 rounded-full bg-gradient-to-br from-primary-1 to-primary-2 px-5 py-2.5 text-[13px] font-bold text-primary-foreground shadow-[0_6px_18px_rgba(15,23,42,0.22)] transition hover:opacity-90 active:scale-[0.98]"
                      >
                        Start a new session
                      </button>
                    </div>
                  )
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      {/* Read-only "input" showing the live transcript / status.
                          Voice-only — it is NOT an editable field (never an
                          <input>/<textarea>); the user can't type here. */}
                      <div
                        aria-live="polite"
                        className="flex min-h-[48px] flex-1 items-center overflow-hidden rounded-full border border-white/[0.06] bg-surface-2/60 px-4 py-2"
                      >
                        <p
                          className={cn(
                            "line-clamp-2 select-none text-[14px] leading-5",
                            isMicActive && mic.transcript
                              ? "text-heading"
                              : "text-muted-foreground"
                          )}
                        >
                          {!isConnected
                            ? "Connecting to K.AI…"
                            : mic.muted
                              ? "You're muted — tap the mic to talk"
                              : mic.starting
                                ? "Getting the mic ready…"
                                : mic.transcript
                                  ? mic.transcript
                                  : isAiSpeaking
                                    ? "K.AI is speaking — just talk to interrupt"
                                    : isAiTyping
                                      ? "K.AI is thinking…"
                                      : "Listening… just talk"}
                        </p>
                      </div>

                      {/* Mute button — the only control in a hands-free call. */}
                      <div className="relative grid shrink-0 place-items-center">
                        <MicLevelRing active={isMicActive} getAnalyser={mic.getAnalyser} />
                        <button
                          type="button"
                          onClick={toggleMute}
                          disabled={sessionOver || !started || !isConnected}
                          aria-pressed={mic.muted}
                          aria-label={mic.muted ? "Unmute microphone" : "Mute microphone"}
                          title={mic.muted ? "Unmute" : "Mute"}
                          className={cn(
                            "relative grid h-12 w-12 select-none place-items-center rounded-full transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40 sm:h-14 sm:w-14",
                            isMicActive
                              ? "scale-105 bg-gradient-to-br from-primary-1 to-primary-2 text-primary-foreground shadow-[0_10px_30px_-6px_rgba(15,23,42,0.6)]"
                              : "border border-white/[0.08] bg-surface-3 text-primary hover:bg-surface-2"
                          )}
                        >
                          {mic.muted ? (
                            <FaMicrophoneSlash className="text-[22px]" />
                          ) : (
                            <FaMicrophone className="text-[22px]" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Desktop hint: Space mutes / unmutes. */}
                    <p className="mt-1.5 hidden text-center text-[11px] text-muted-foreground sm:block">
                      Just talk — K.AI answers when you pause. Press{" "}
                      <kbd className="rounded bg-surface-3 px-1.5 py-0.5 font-mono text-[10px] text-heading">
                        Space
                      </kbd>{" "}
                      to {mic.muted ? "unmute" : "mute"}
                    </p>
                  </>
                )}
              </div>
            </section>

            <aside id="aip-tour-stats" className="hidden min-h-0 flex-col gap-4 overflow-y-auto xl:flex">
              {accessToken && (
                <>
                  <SpeechProgressCard
                    totalSeconds={speechProgress.totalSeconds}
                    milestonesAwarded={speechProgress.milestonesAwarded}
                    thresholdSeconds={speechProgress.thresholdSeconds}
                    thresholdXp={speechProgress.thresholdXp}
                    recurringInterval={speechProgress.recurringInterval}
                    recurringXp={speechProgress.recurringXp}
                    nextMilestoneAt={speechProgress.nextMilestoneAt}
                    nextMilestoneXp={speechProgress.nextMilestoneXp}
                    header={
                      <div className="grid place-items-center py-1">
                        <VoiceAgent
                          emotion={mascotEmotion}
                          isThinking={isAiTyping}
                          size={120}
                        />
                      </div>
                    }
                  />
                </>
              )}

              <Panel title="TIPS FROM K.AI">
                {(() => {
                  const tip = TIPS[tipIndex];
                  const Icon = tip.icon;
                  return (
                    // key={tipIndex} re-mounts so each rotated tip fades in.
                    <div
                      key={tipIndex}
                      className="animate-in fade-in flex min-h-[3.25rem] items-start gap-4 duration-500"
                    >
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                        <Icon className="text-[18px]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[14px] font-extrabold text-heading">{tip.title}</p>
                        <p className="mt-1 text-[13px] leading-6 text-muted-foreground">{tip.body}</p>
                      </div>
                    </div>
                  );
                })()}
              </Panel>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

// Cycled while K.AI is thinking — we never show Gemini's raw reasoning, just
// a friendly status that it's working on a reply.
const THINKING_PHRASES = [
  "Thinking…",
  "Preparing a personalised response…",
  "Putting my thoughts together…",
];

function TypingIndicator() {
  const [phraseIdx, setPhraseIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(
      () => setPhraseIdx((i) => (i + 1) % THINKING_PHRASES.length),
      2200,
    );
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex items-end gap-3">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-surface-2 border border-white/[0.06]">
        <PixelMascot isThinking size={48} />
      </div>
      <div className="c-box rounded-[18px] px-5 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="h-2.5 w-2.5 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="h-2.5 w-2.5 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {THINKING_PHRASES[phraseIdx]}
          </span>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="c-box rounded-xl px-5 py-5">
      <h3 className="text-[15px] font-extrabold uppercase tracking-[0.08em] text-gradient">
        {title}
      </h3>
      <div className="mt-5">{children}</div>
    </section>
  );
}
