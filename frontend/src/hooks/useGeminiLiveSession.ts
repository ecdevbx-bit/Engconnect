"use client";

// AI Partner on Gemini Live (DECISIONS.md D-004 / D-007).
//
// Drop-in replacement for useV3ChatSession + the Deepgram/Web Speech capture:
// returns the SAME UseV3ChatSessionResult shape plus a hands-free `mic`.
//
//   1. POST /api/chat/sessions → our server checks the time cap, leases a
//      Gemini key from the pool and mints a single-use ephemeral token with
//      the K.AI prompt locked inside.
//   2. The browser opens a WebSocket straight to Gemini Live with that token.
//      Hands-free, like a phone call (D-039): once connected the mic streams
//      16 kHz PCM continuously; Gemini's own voice detection decides when the
//      learner has finished and replies; talking over K.AI interrupts it.
//      While K.AI plays, quiet mic frames are sent as silence (echo gate) so
//      its own voice can't interrupt it. The learner's only control is mute.
//      Gemini streams back 24 kHz PCM audio + live transcripts of both sides.
//   3. Every ~20 s we POST /progress (talk-time, new transcript turns); the
//      server clamps talk-time, awards XP and says if the cap is reached.
//   4. Socket trouble: a plain drop resumes the same Gemini session with its
//      resumption handle; a quota/key failure asks our server for a token on
//      ANOTHER key and replays the recent conversation as context.
//   5. D-054: the mic stays open for the whole call (mute and reconnects only
//      stop sending), so phones never switch audio mode mid-call; K.AI's words
//      are revealed in step with its voice (Gemini sends them seconds early);
//      the learner's words show while they speak (desktop preview, see
//      audio/speechPreview.ts); a barge-in must be loud AND sustained, so a
//      cough, a "mm" or K.AI's own echo no longer cuts K.AI off.

import { useCallback, useEffect, useRef, useState } from "react";

import { MicPcmStream } from "@/audio/micPcmStream";
import { PcmPlayer } from "@/audio/pcmPlayer";
import { SpeechPreview, speechPreviewSupported } from "@/audio/speechPreview";
import { ApiError, v3Fetch } from "@/lib/apiClient";
import { notifyBadgeAwards } from "@/lib/badgeAward";
import { getSessionId } from "@/lib/sessionId";
import { handleSessionSuperseded, SESSION_SUPERSEDED_CODE } from "@/lib/sessionSupersede";
import { AI_TIME_LIMIT_REACHED_CODE, type AIPartnerRewards, type V3CreateSessionResponse } from "@/lib/v3Chat";
import { useAppDispatch } from "@/store/hooks";
import { setCombo, syncFromBackend, triggerLevelUp } from "@/store/slices/xpSlice";
import type {
  ServerSpeechProgress,
  SpeechProgressState,
  UseV3ChatSessionOptions,
  UseV3ChatSessionResult,
  V3ChatMessage,
} from "./useV3ChatSession";

const LOG = "[gemini-live]";
const HEARTBEAT_MS = 20_000;
const REPLY_TIMEOUT_MS = 15_000;
const MAX_RECONNECTS = 4;
const HISTORY_REPLAY_TURNS = 12;
// Echo gate: while K.AI's audio plays, mic frames are sent as silence unless
// the learner is barging in for BARGE_CONFIRM_MS in a row (one loud frame used
// to be enough, so a cough, a "mm" or K.AI's own echo cut K.AI off — ~10 % of
// its replies in October). Once confirmed, frames pass for BARGE_HOLD_MS so
// Gemini hears the learner and interrupts K.AI.
// The bar is relative, measured on this device (D-062): above K.AI's own echo
// (learned while it plays) × BARGE_ECHO_RATIO and above BARGE_VOICE_SHARE of
// the learner's usual level. It used to be a fixed RMS 0.05 — with the browser's
// auto-gain off (D-054) many phone/laptop mics put a normal voice at 0.02–0.04,
// so learners could not interrupt at all. The echo part is capped at
// BARGE_ECHO_CAP of their voice, so a loud echo estimate can't lock them out.
const BARGE_MIN_RMS = 0.015;
const BARGE_ECHO_RATIO = 2.5; // ≈ 8 dB over the echo
const BARGE_ECHO_CAP = 0.8;
const BARGE_VOICE_SHARE = 0.4;
const BARGE_CONFIRM_MS = 200;
const BARGE_HOLD_MS = 1500;
const ECHO_START_RMS = 0.03;

// The bar a mic frame must clear to count towards a barge-in.
export function bargeThreshold(echoRms: number, voiceRms: number): number {
  return Math.max(
    BARGE_MIN_RMS,
    Math.min(echoRms * BARGE_ECHO_RATIO, voiceRms * BARGE_ECHO_CAP),
    voiceRms * BARGE_VOICE_SHARE,
  );
}
const POLL_MS = 100;
// Caption pieces are shown this far ahead of their audio (reading lag).
const CAPTION_LEAD_S = 0.08;
// A learner preview only counts if the mic's voice gate was open this recently.
const PREVIEW_VOICE_MS = 800;
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

// Fire-and-forget end for a session id (keepalive survives page unload).
function sendEnd(id: string, token: string, body: Record<string, unknown>): void {
  const sid = getSessionId();
  void fetch(`${API_URL}/api/chat/sessions/${encodeURIComponent(id)}/end`, {
    method: "POST",
    keepalive: true,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(sid ? { "X-Session-Id": sid } : {}) },
    body: JSON.stringify(body),
  }).catch(() => {});
}

type LiveGrant = {
  token: string;
  wsUrl: string;
  model: string;
  apiVersion: string;
  expiresAt: string;
  kickoff?: string;
};

type CreateResponse = V3CreateSessionResponse & { live: LiveGrant };

type ProgressResponse = ServerSpeechProgress & {
  capReached: boolean;
  sessionActive: boolean;
  usedSeconds: number;
  capSeconds: number;
  remainingSeconds: number;
};

type Turn = { role: "user" | "assistant"; text: string };

type ConnectMode = "fresh" | "resume" | "replay";

// A piece of K.AI's caption waiting for its audio (`at` on the player's clock;
// NaN = its audio hasn't arrived yet).
type CaptionPiece = { bubbleId: string; text: string; at: number };

export type LiveCaption = { who: "you" | "kai"; text: string } | null;

// iOS Safari (16.4+): keep the audio session in call mode for the whole
// conversation instead of letting it flip when the mic opens.
function setAudioSession(type: "play-and-record" | "auto") {
  const nav = navigator as unknown as { audioSession?: { type: string } };
  try {
    if (nav.audioSession) nav.audioSession.type = type;
  } catch {
    /* unsupported */
  }
}

function captionTail(text: string, words = 14): string {
  const w = text.trim().split(/\s+/);
  return w.length > words ? `…${w.slice(-words).join(" ")}` : text.trim();
}

// Gemini Live server message (only the fields we use).
type LiveMessage = {
  setupComplete?: object;
  serverContent?: {
    modelTurn?: { parts?: { inlineData?: { mimeType?: string; data?: string }; text?: string; thought?: boolean }[] };
    turnComplete?: boolean;
    interrupted?: boolean;
    generationComplete?: boolean;
    inputTranscription?: { text?: string };
    outputTranscription?: { text?: string };
  };
  usageMetadata?: { promptTokenCount?: number; responseTokenCount?: number; totalTokenCount?: number };
  goAway?: { timeLeft?: string };
  sessionResumptionUpdate?: { newHandle?: string; resumable?: boolean };
};

function initialProgress(rewards: AIPartnerRewards | null): SpeechProgressState {
  return {
    totalSeconds: 0,
    wordsSpoken: 0,
    milestonesAwarded: 0,
    thresholdSeconds: rewards?.thresholdSeconds ?? 15,
    thresholdXp: rewards?.thresholdXp ?? 10,
    recurringInterval: rewards?.recurringIntervalSeconds ?? 60,
    recurringXp: rewards?.recurringXp ?? 30,
    nextMilestoneAt: rewards?.thresholdSeconds ?? 15,
    nextMilestoneXp: rewards?.thresholdXp ?? 10,
    totalXp: 0,
    currentLevel: 0,
    combo: 0,
    lastMilestoneId: 0,
    lastXpEarned: 0,
    lastLeveledUp: false,
    lastNewBadges: undefined,
  };
}

function timeLabel() {
  return new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function looksLikeKeyProblem(reason: string): boolean {
  const r = reason.toLowerCase();
  return ["quota", "resource_exhausted", "exceeded", "rate limit", "api key", "billing", "permission"].some((k) => r.includes(k));
}

// The hands-free mic. `open` = streaming to K.AI (not muted).
export type LiveMic = {
  open: boolean;
  starting: boolean;
  muted: boolean;
  // The learner's current utterance, live (clears when K.AI answers it).
  transcript: string;
  error: string | null;
  toggleMute: () => void;
  getAnalyser: () => AnalyserNode | null;
};

export type GeminiLiveOptions = UseV3ChatSessionOptions & {
  // Session setup picked on the start card (see lib/aiPartnerOptions.ts).
  scenario?: string;
  voice?: string;
  /** Pro: id of a past conversation this session continues (D-047). */
  continueFrom?: string | null;
};

export function useGeminiLiveSession({
  enabled,
  accessToken,
  nativeLanguage,
  level,
  scenario,
  voice,
  continueFrom,
}: GeminiLiveOptions): UseV3ChatSessionResult & { mic: LiveMic; isAiSpeaking: boolean; caption: LiveCaption } {
  const dispatch = useAppDispatch();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<V3ChatMessage[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [rewards, setRewards] = useState<AIPartnerRewards | null>(null);
  const [aiUsedSeconds, setAiUsedSeconds] = useState(0);
  const [aiCapSeconds, setAiCapSeconds] = useState(0);
  const [aiLimitReached, setAiLimitReached] = useState(false);
  const [speechProgress, setSpeechProgress] = useState<SpeechProgressState>(() => initialProgress(null));
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  // mic state
  const [micOpen, setMicOpen] = useState(false);
  const [micStarting, setMicStarting] = useState(false);
  const [muted, setMuted] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [micError, setMicError] = useState<string | null>(null);
  const [caption, setCaption] = useState<LiveCaption>(null);

  const playerRef = useRef<PcmPlayer | null>(null);
  if (playerRef.current === null) playerRef.current = new PcmPlayer();
  const micRef = useRef<MicPcmStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const grantRef = useRef<LiveGrant | null>(null);
  const resumeHandleRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const tokenRef = useRef(accessToken);
  const closedRef = useRef(false);
  const endedRef = useRef(false);
  const reconnectsRef = useRef(0);
  const goAwayRef = useRef(false);
  const mutedRef = useRef(false);
  const micBusyRef = useRef(false);
  const bargeUntilRef = useRef(0);
  const bargeMsRef = useRef(0);
  // K.AI's own voice as it reaches the mic (after echo cancellation), learned
  // while it plays. Starts high (cautious) and drops to the real echo within
  // ~0.5 s, so loud speakers don't count as a barge-in before it's learned.
  const echoRmsRef = useRef(ECHO_START_RMS);
  const speakingMsRef = useRef(0);
  const usageRef = useRef({ promptTokens: 0, responseTokens: 0 });
  const pendingTurnsRef = useRef<Turn[]>([]);
  const historyRef = useRef<Turn[]>([]);
  const userBubbleRef = useRef<string | null>(null);
  const userTextRef = useRef("");
  const assistantBubbleRef = useRef<string | null>(null);
  const assistantTextRef = useRef("");
  const replyTimerRef = useRef<number | null>(null);
  const heartbeatRef = useRef<number | null>(null);
  // Lets callbacks declared before close() (progress, reconnect) end the session.
  const closeRef = useRef<() => void>(() => {});
  const speakingPollRef = useRef<number | null>(null);
  // K.AI's caption pieces not yet heard, and what each bubble has shown so far.
  const captionQueueRef = useRef<CaptionPiece[]>([]);
  const revealedRef = useRef(new Map<string, string>());
  const streamingIdRef = useRef<string | null>(null);
  const turnDoneRef = useRef(true);
  // Desktop live preview of the learner's words (null where unsupported).
  const previewRef = useRef<SpeechPreview | null>(null);
  const previewBubbleRef = useRef(false);
  const previewTextRef = useRef("");
  const lastRevealedIdRef = useRef<string | null>(null);
  const captionKeyRef = useRef("");

  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);

  // ── helpers ──────────────────────────────────────────────────────

  const send = useCallback((msg: object) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
  }, []);

  const clearReplyTimer = useCallback(() => {
    if (replyTimerRef.current !== null) {
      window.clearTimeout(replyTimerRef.current);
      replyTimerRef.current = null;
    }
  }, []);

  const armReplyTimer = useCallback(() => {
    clearReplyTimer();
    replyTimerRef.current = window.setTimeout(() => {
      // Never leave the mic locked behind a reply that isn't coming.
      setIsAiTyping(false);
    }, REPLY_TIMEOUT_MS);
  }, [clearReplyTimer]);

  const upsertBubble = useCallback((id: string, role: "user" | "assistant", body: string) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === id)) return prev.map((m) => (m.id === id ? { ...m, body } : m));
      return [...prev, { id, role, time: timeLabel(), body }];
    });
  }, []);

  // Each side of the conversation is closed out separately (queued for the
  // server transcript + kept as replay history). In a hands-free call the
  // learner's words end when K.AI starts answering, and K.AI's words end when
  // its turn completes OR the learner interrupts it — so the next utterance
  // always gets its own bubble, in order.
  const remember = (role: "user" | "assistant", text: string) => {
    pendingTurnsRef.current.push({ role, text });
    historyRef.current.push({ role, text });
    historyRef.current = historyRef.current.slice(-40);
  };

  const commitUser = useCallback(() => {
    const u = userTextRef.current.trim();
    if (u) remember("user", u);
    // A bubble that only ever held the desktop preview (Gemini heard nothing
    // it counted, e.g. background speech) is removed.
    const id = userBubbleRef.current;
    if (!u && id && previewBubbleRef.current) setMessages((prev) => prev.filter((m) => m.id !== id));
    previewBubbleRef.current = false;
    previewTextRef.current = "";
    userTextRef.current = "";
    userBubbleRef.current = null;
    setTranscript("");
    previewRef.current?.reset();
  }, []);

  // `spokenOnly`: K.AI was interrupted — keep only the words it actually said.
  const commitAssistant = useCallback((spokenOnly = false) => {
    // After turnComplete the bubble is still being revealed (streamingIdRef).
    const id = assistantBubbleRef.current ?? (spokenOnly ? streamingIdRef.current : null);
    const a = (spokenOnly ? (id ? revealedRef.current.get(id) ?? "" : "") : assistantTextRef.current).trim();
    if (a) remember("assistant", a);
    if (spokenOnly) captionQueueRef.current = captionQueueRef.current.filter((p) => p.bubbleId !== id);
    assistantTextRef.current = "";
    assistantBubbleRef.current = null;
  }, []);

  const commitTurns = useCallback(() => {
    commitUser();
    commitAssistant();
  }, [commitUser, commitAssistant]);

  const applyProgress = useCallback(
    (p: ProgressResponse) => {
      setSpeechProgress((prev) => ({
        totalSeconds: p.totalSeconds,
        wordsSpoken: p.wordsSpoken,
        milestonesAwarded: p.milestonesAwarded,
        thresholdSeconds: p.thresholdSeconds,
        thresholdXp: p.thresholdXp,
        recurringInterval: p.recurringInterval,
        recurringXp: p.recurringXp,
        nextMilestoneAt: p.nextMilestoneAt,
        nextMilestoneXp: p.nextMilestoneXp,
        totalXp: p.totalXp,
        currentLevel: p.currentLevel,
        combo: p.combo,
        lastMilestoneId: p.xpEarned && p.xpEarned > 0 ? prev.lastMilestoneId + 1 : prev.lastMilestoneId,
        lastXpEarned: p.xpEarned ?? 0,
        lastLeveledUp: p.leveledUp ?? false,
        lastNewBadges: p.newlyEarnedBadges,
      }));
      if (p.xpEarned && p.xpEarned > 0) {
        dispatch(syncFromBackend({ totalXp: p.totalXp, currentLevel: p.currentLevel }));
        dispatch(setCombo({ category: "ai-partner", value: p.combo }));
        if (p.leveledUp) dispatch(triggerLevelUp(p.currentLevel));
        else notifyBadgeAwards(dispatch, p.newlyEarnedBadges);
      }
      if (p.capReached) setAiLimitReached(true);
    },
    [dispatch],
  );

  // Talk-time = moments the (unmuted) learner's voice was heard while K.AI was
  // quiet, sampled every POLL_MS. The server still clamps it (≤ wall-clock,
  // ≤ ~2 s per transcribed word).
  const speakingSeconds = () => Math.floor(speakingMsRef.current / 1000);

  const postProgress = useCallback(async () => {
    const id = sessionIdRef.current;
    const token = tokenRef.current;
    if (!id || !token || endedRef.current) return;
    const turns = pendingTurnsRef.current.splice(0);
    try {
      const p = await v3Fetch<ProgressResponse>(`/chat/sessions/${encodeURIComponent(id)}/progress`, token, {
        method: "POST",
        body: { speakingSeconds: speakingSeconds(), turns, usage: usageRef.current },
      });
      applyProgress(p);
      if (!p.sessionActive) {
        // Ended on the server (opened in another tab, swept as stale…): stop
        // the mic, socket and heartbeat so nothing keeps running for it.
        setError("This conversation was ended (maybe opened in another tab).");
        closeRef.current();
      }
    } catch (err) {
      pendingTurnsRef.current.unshift(...turns); // retry them next beat
      console.warn(`${LOG} progress failed`, err);
    }
  }, [applyProgress]);

  // Final report. keepalive lets it finish even while the page unloads.
  const postEnd = useCallback((reason: string) => {
    const id = sessionIdRef.current;
    const token = tokenRef.current;
    if (!id || !token || endedRef.current) return;
    endedRef.current = true;
    sendEnd(id, token, {
      speakingSeconds: speakingSeconds(),
      turns: pendingTurnsRef.current.splice(0),
      usage: usageRef.current,
      reason,
    });
  }, []);

  // ── socket ───────────────────────────────────────────────────────

  const handleMessageRef = useRef<(m: LiveMessage, mode: ConnectMode) => void>(() => {});
  const handleCloseRef = useRef<(ev: CloseEvent) => void>(() => {});

  const openSocket = useCallback(
    (grant: LiveGrant, mode: ConnectMode) => {
      grantRef.current = grant;
      goAwayRef.current = false;
      const ws = new WebSocket(grant.wsUrl);
      wsRef.current = ws;
      ws.onopen = () => {
        if (wsRef.current !== ws) return;
        ws.send(
          JSON.stringify({
            setup: {
              model: grant.model,
              sessionResumption: mode === "resume" && resumeHandleRef.current ? { handle: resumeHandleRef.current } : {},
            },
          }),
        );
      };
      ws.onmessage = async (ev) => {
        if (wsRef.current !== ws) return;
        try {
          const text = typeof ev.data === "string" ? ev.data : await (ev.data as Blob).text();
          handleMessageRef.current(JSON.parse(text) as LiveMessage, mode);
        } catch (err) {
          console.warn(`${LOG} bad frame`, err);
        }
      };
      ws.onerror = () => console.warn(`${LOG} socket error`);
      ws.onclose = (ev) => {
        if (wsRef.current !== ws) return;
        handleCloseRef.current(ev);
      };
    },
    [],
  );

  // Ask our server for a token (possibly on another key) and continue the
  // conversation there, replaying recent turns as context.
  const serverReconnect = useCallback(
    async (keyFailed: boolean, detail: string, closeCode?: number) => {
      const id = sessionIdRef.current;
      const token = tokenRef.current;
      if (!id || !token || closedRef.current) return;
      if (reconnectsRef.current >= MAX_RECONNECTS) {
        setError("Lost the connection to K.AI. Please start a new session.");
        closeRef.current();
        return;
      }
      reconnectsRef.current += 1;
      try {
        const res = await v3Fetch<{ live: LiveGrant }>(`/chat/sessions/${encodeURIComponent(id)}/reconnect`, token, {
          method: "POST",
          body: { keyFailed, detail: detail.slice(0, 400), closeCode },
        });
        if (closedRef.current) return;
        resumeHandleRef.current = null;
        openSocket(res.live, "replay");
      } catch (err) {
        // Either way this conversation can't continue: end it so the
        // heartbeat stops billing time against the learner's allowance.
        if (err instanceof ApiError && err.code === AI_TIME_LIMIT_REACHED_CODE) setAiLimitReached(true);
        else setError(err instanceof Error ? err.message : "Couldn't reconnect to K.AI.");
        closeRef.current();
      }
    },
    [openSocket],
  );

  // ── hands-free mic ───────────────────────────────────────────────

  // Open the mic and stream continuously (no activityStart/End — Gemini's
  // voice detection finds the turns). No-op when muted or already open.
  const openMic = useCallback(async () => {
    if (mutedRef.current || micRef.current || micBusyRef.current) return;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    micBusyRef.current = true;
    setMicStarting(true);
    setMicError(null);
    const mic = new MicPcmStream();
    micRef.current = mic;
    mic.gate = (rms, frameMs) => {
      if (!playerRef.current?.isPlaying()) {
        bargeMsRef.current = 0;
        return true;
      }
      const now = performance.now();
      if (now < bargeUntilRef.current) return true;
      if (rms > bargeThreshold(echoRmsRef.current, mic.voiceLevel)) {
        bargeMsRef.current += frameMs;
      } else {
        bargeMsRef.current = Math.max(0, bargeMsRef.current - frameMs * 2);
        // Learn the echo: follow it down fast, up over ~1.5 s.
        const e = echoRmsRef.current;
        echoRmsRef.current = e + (rms - e) * (rms > e ? frameMs / 1500 : 0.05);
      }
      if (bargeMsRef.current < BARGE_CONFIRM_MS) return false;
      bargeMsRef.current = 0;
      bargeUntilRef.current = now + BARGE_HOLD_MS;
      // Gemini only reports `interrupted` while it is still generating; once
      // the reply is complete, stop the rest of its playback ourselves.
      if (turnDoneRef.current) {
        playerRef.current?.flush();
        const id = streamingIdRef.current;
        captionQueueRef.current = captionQueueRef.current.filter((p) => p.bubbleId !== id);
      }
      return true;
    };
    try {
      await mic.start((b64) => send({ realtimeInput: { audio: { mimeType: mic.mimeType, data: b64 } } }));
      if (micRef.current !== mic) {
        mic.stop(); // closed/muted while we were waiting for permission
        return;
      }
      mic.paused = mutedRef.current;
      setMicOpen(true);
      if (!mutedRef.current) previewRef.current?.start();
    } catch (err) {
      mic.stop();
      if (micRef.current === mic) micRef.current = null;
      const name = (err as { name?: string })?.name;
      setMicError(
        name === "NotAllowedError" || name === "SecurityError"
          ? "Microphone access denied. Allow it in your browser and try again."
          : name === "NotFoundError"
            ? "No microphone detected. Plug one in and try again."
            : "Couldn't start the microphone. Please try again.",
      );
    } finally {
      micBusyRef.current = false;
      setMicStarting(false);
    }
  }, [send]);

  // Release the mic — only when the conversation ends. Mute and reconnects
  // keep it open: releasing it switched phones out of call audio, so K.AI's
  // voice changed volume / jumped between speaker and earpiece (D-054).
  const closeMic = useCallback(() => {
    const mic = micRef.current;
    micRef.current = null;
    mic?.stop();
    previewRef.current?.stop();
    setMicOpen(false);
  }, []);

  const toggleMute = useCallback(() => {
    const mic = micRef.current;
    if (mutedRef.current) {
      mutedRef.current = false;
      setMuted(false);
      if (mic) {
        mic.paused = false;
        previewRef.current?.start();
      } else void openMic();
    } else {
      mutedRef.current = true;
      setMuted(true);
      if (mic) {
        mic.paused = true;
        // Tell Gemini the audio paused, so it wraps up the current turn.
        send({ realtimeInput: { audioStreamEnd: true } });
      }
      previewRef.current?.stop();
    }
  }, [openMic, send]);

  // Socket handlers use only refs + stable callbacks. They are (re)bound in an
  // effect after every render (never during render) so they see fresh closures.
  useEffect(() => {
    handleCloseRef.current = (ev: CloseEvent) => {
      setIsConnected(false);
      clearReplyTimer();
      // The mic stays open; its audio is dropped until the replacement socket is up.
      if (closedRef.current) return;
      const reason = ev.reason || "";
      console.warn(`${LOG} socket closed`, ev.code, reason);
      if (looksLikeKeyProblem(reason)) {
        void serverReconnect(true, reason, ev.code);
      } else if (resumeHandleRef.current && grantRef.current && reconnectsRef.current < 2 && !/token|expired|unauth/i.test(reason)) {
        // Plain drop / goAway: resume the SAME Gemini session.
        reconnectsRef.current += 1;
        openSocket(grantRef.current, "resume");
      } else {
        void serverReconnect(false, reason || `closed ${ev.code}`, ev.code);
      }
    };

    handleMessageRef.current = (msg: LiveMessage, mode: ConnectMode) => {
      if (msg.setupComplete) {
        setIsConnected(true);
        setError(null);
        // Hands-free: the mic is live for the whole call (unless muted).
        void openMic();
        if (mode === "fresh" && grantRef.current?.kickoff) {
          send({ clientContent: { turns: [{ role: "user", parts: [{ text: grantRef.current.kickoff }] }], turnComplete: true } });
          setIsAiTyping(true);
          armReplyTimer();
        } else if (mode === "replay" && historyRef.current.length) {
          const recap = historyRef.current
            .slice(-HISTORY_REPLAY_TURNS)
            .map((t) => `${t.role === "user" ? "Learner" : "K.AI"}: ${t.text}`)
            .join("\n");
          send({
            clientContent: {
              turns: [{ role: "user", parts: [{ text: `[Connection restored. Conversation so far:]\n${recap}\n[Continue naturally from here; the learner speaks next.]` }] }],
              turnComplete: false,
            },
          });
        }
        return;
      }

      if (msg.sessionResumptionUpdate?.resumable && msg.sessionResumptionUpdate.newHandle) {
        resumeHandleRef.current = msg.sessionResumptionUpdate.newHandle;
      }
      if (msg.goAway) goAwayRef.current = true; // server will close soon → resume
      if (msg.usageMetadata) {
        usageRef.current.promptTokens += msg.usageMetadata.promptTokenCount ?? 0;
        usageRef.current.responseTokens += msg.usageMetadata.responseTokenCount ?? 0;
      }

      const sc = msg.serverContent;
      if (!sc) return;

      if (sc.inputTranscription?.text) {
        // Gemini's transcript replaces the desktop preview for this utterance.
        userTextRef.current += sc.inputTranscription.text;
        previewBubbleRef.current = false;
        const text = userTextRef.current.trim();
        setTranscript(text);
        if (text) {
          if (!userBubbleRef.current) userBubbleRef.current = crypto.randomUUID();
          upsertBubble(userBubbleRef.current, "user", text);
          setCaption({ who: "you", text: captionTail(text) });
        }
      }

      // The learner talked over K.AI: Gemini stopped generating — silence the
      // queued audio now and close K.AI's bubble at the words it actually said.
      if (sc.interrupted) {
        playerRef.current?.flush();
        commitAssistant(true);
      }

      if (sc.modelTurn?.parts) {
        for (const part of sc.modelTurn.parts) {
          const data = part.inlineData?.data;
          if (data && (part.inlineData?.mimeType ?? "").startsWith("audio/")) {
            clearReplyTimer();
            setIsAiTyping(false);
            // K.AI is answering → the learner's utterance is complete.
            if (userTextRef.current || previewBubbleRef.current) commitUser();
            const player = playerRef.current;
            if (player) {
              player.enqueueBase64Pcm(data);
              // Caption text that arrived before its audio belongs to this chunk.
              const at = player.lastChunkStart();
              for (const p of captionQueueRef.current) if (Number.isNaN(p.at)) p.at = at;
            }
          }
          // Text parts on native-audio models are internal reasoning — never shown.
        }
      }

      if (sc.outputTranscription?.text) {
        clearReplyTimer();
        setIsAiTyping(false);
        if (userTextRef.current || previewBubbleRef.current) commitUser();
        assistantTextRef.current += sc.outputTranscription.text;
        if (!assistantBubbleRef.current) assistantBubbleRef.current = crypto.randomUUID();
        turnDoneRef.current = false;
        // Shown when its audio plays (the tick below), not when it arrives.
        const at = playerRef.current?.lastChunkStart() || Number.NaN;
        captionQueueRef.current.push({ bubbleId: assistantBubbleRef.current, text: sc.outputTranscription.text, at });
      }

      if (sc.turnComplete) {
        clearReplyTimer();
        setIsAiTyping(false);
        commitTurns();
        turnDoneRef.current = true;
        reconnectsRef.current = 0; // a healthy exchange resets the retry budget
      }
    };
  });

  // ── captions ─────────────────────────────────────────────────────

  // Move K.AI's caption pieces whose audio is now playing into their bubble,
  // and work out the one-line live caption. Runs every POLL_MS (refs only).
  const revealCaptions = (playing: boolean) => {
    const clock = playerRef.current?.clock() ?? 0;
    const q = captionQueueRef.current;
    const changed = new Set<string>();
    while (q.length) {
      const p = q[0];
      // No audio for this text (text-only reply, or audio never came): show it once the turn is over.
      const due = Number.isNaN(p.at) ? turnDoneRef.current && !playing : p.at <= clock + CAPTION_LEAD_S;
      if (!due) break;
      q.shift();
      revealedRef.current.set(p.bubbleId, (revealedRef.current.get(p.bubbleId) ?? "") + p.text);
      lastRevealedIdRef.current = p.bubbleId;
      changed.add(p.bubbleId);
    }
    for (const id of changed) upsertBubble(id, "assistant", (revealedRef.current.get(id) ?? "").trim());
    if (revealedRef.current.size > 20) {
      // Only recent bubbles can still change.
      const keep = new Set([...q.map((p) => p.bubbleId), lastRevealedIdRef.current]);
      for (const id of [...revealedRef.current.keys()]) if (!keep.has(id)) revealedRef.current.delete(id);
    }

    const sid = q[0]?.bubbleId ?? assistantBubbleRef.current ?? null;
    if (sid !== streamingIdRef.current) {
      streamingIdRef.current = sid;
      setStreamingId(sid);
    }

    const learner = (userTextRef.current || previewTextRef.current).trim();
    const kai = playing && lastRevealedIdRef.current ? revealedRef.current.get(lastRevealedIdRef.current) ?? "" : "";
    const next: LiveCaption = learner && !playing ? { who: "you", text: captionTail(learner) } : kai.trim() ? { who: "kai", text: captionTail(kai) } : null;
    const key = next ? `${next.who}:${next.text}` : "";
    if (key !== captionKeyRef.current) {
      captionKeyRef.current = key;
      setCaption(next);
    }
  };

  // Desktop preview of the learner's words (audio/speechPreview.ts). Only
  // while our own voice gate hears a near voice, so a TV isn't captioned.
  const onPreviewRef = useRef<(text: string) => void>(() => {});
  useEffect(() => {
    onPreviewRef.current = (text: string) => {
      const mic = micRef.current;
      if (!text || userTextRef.current || !mic || mutedRef.current) return;
      const now = performance.now();
      if (now - mic.lastVoiceAt > PREVIEW_VOICE_MS) return;
      if (playerRef.current?.isPlaying() && now > bargeUntilRef.current) return;
      if (!userBubbleRef.current) userBubbleRef.current = crypto.randomUUID();
      previewBubbleRef.current = true;
      previewTextRef.current = text;
      upsertBubble(userBubbleRef.current, "user", text);
      setTranscript(text);
    };
  });

  // ── lifecycle ────────────────────────────────────────────────────

  const close = useCallback(() => {
    if (closedRef.current && !wsRef.current && heartbeatRef.current === null) return; // already closed
    closedRef.current = true;
    clearReplyTimer();
    if (heartbeatRef.current !== null) window.clearInterval(heartbeatRef.current);
    heartbeatRef.current = null;
    if (speakingPollRef.current !== null) window.clearInterval(speakingPollRef.current);
    speakingPollRef.current = null;
    closeMic();
    setAudioSession("auto");
    captionQueueRef.current = [];
    revealedRef.current.clear();
    streamingIdRef.current = null;
    setStreamingId(null);
    setCaption(null);
    setMicStarting(false);
    // The next conversation starts unmuted.
    mutedRef.current = false;
    setMuted(false);
    const ws = wsRef.current;
    wsRef.current = null;
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) ws.close(1000, "session ended");
    setIsConnected(false);
    setIsAiTyping(false);
    playerRef.current?.stop();
    commitTurns();
    postEnd("closed");
  }, [clearReplyTimer, closeMic, commitTurns, postEnd]);
  useEffect(() => {
    closeRef.current = close;
  }, [close]);

  useEffect(() => {
    if (!enabled || !accessToken) return;
    let cancelled = false;
    closedRef.current = false;
    endedRef.current = false;
    sessionIdRef.current = null;
    reconnectsRef.current = 0;
    speakingMsRef.current = 0;
    usageRef.current = { promptTokens: 0, responseTokens: 0 };
    pendingTurnsRef.current = [];
    historyRef.current = [];
    resumeHandleRef.current = null;
    captionQueueRef.current = [];
    revealedRef.current.clear();
    setAudioSession("play-and-record");
    previewRef.current = speechPreviewSupported() ? new SpeechPreview((t) => onPreviewRef.current(t)) : null;

    (async () => {
      try {
        const res = await v3Fetch<CreateResponse>("/chat/sessions", accessToken, {
          method: "POST",
          body: { language: nativeLanguage, level, scenario, voice, ...(continueFrom ? { continueFrom } : {}) },
        });
        if (cancelled) {
          // Left the screen while the session was being created: end it now
          // instead of leaving a live key slot held until the stale sweep.
          sendEnd(res.sessionID, accessToken, { speakingSeconds: 0, turns: [], reason: "cancelled" });
          return;
        }
        // Fresh conversation: clear anything left from a previous session.
        setMessages([]);
        setError(null);
        setAiLimitReached(false);
        sessionIdRef.current = res.sessionID;
        setSessionId(res.sessionID);
        setRewards(res.rewards);
        setAiUsedSeconds(res.aiUsedSeconds ?? 0);
        setAiCapSeconds(res.aiCapSeconds ?? 0);
        setSpeechProgress(initialProgress(res.rewards));
        openSocket(res.live, "fresh");
        heartbeatRef.current = window.setInterval(() => void postProgress(), HEARTBEAT_MS);
        speakingPollRef.current = window.setInterval(() => {
          const playing = playerRef.current?.isPlaying() ?? false;
          setIsAiSpeaking(playing);
          const mic = micRef.current;
          if (mic && !mutedRef.current && !playing && performance.now() - mic.lastVoiceAt < POLL_MS + 100) {
            speakingMsRef.current += POLL_MS;
          }
          revealCaptions(playing);
        }, POLL_MS);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.code === AI_TIME_LIMIT_REACHED_CODE) {
          setAiLimitReached(true);
          return;
        }
        if (err instanceof ApiError && err.code === SESSION_SUPERSEDED_CODE) {
          handleSessionSuperseded();
          return;
        }
        setError(err instanceof Error ? err.message : "Couldn't start the session.");
      }
    })();

    const onPageHide = () => postEnd("pagehide");
    window.addEventListener("pagehide", onPageHide);
    return () => {
      cancelled = true;
      window.removeEventListener("pagehide", onPageHide);
      close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, accessToken ? "signed-in" : "signed-out"]);

  // Legacy contract (UseV3ChatSessionResult): show a learner line in their
  // bubble. Gemini already has the audio; captions normally come from it.
  const sendUserMessage = useCallback(
    (text: string) => {
      const t = text.trim();
      if (!t) return;
      if (!userBubbleRef.current) userBubbleRef.current = crypto.randomUUID();
      if (t.length >= userTextRef.current.trim().length) {
        userTextRef.current = t;
        upsertBubble(userBubbleRef.current, "user", t);
      }
    },
    [upsertBubble],
  );

  const primeAudio = useCallback(() => playerRef.current?.prime(), []);
  const interruptAudio = useCallback(() => playerRef.current?.flush(), []);
  const getOutputAnalyser = useCallback(() => playerRef.current?.getAnalyser() ?? null, []);
  const getAnalyser = useCallback(() => micRef.current?.getAnalyser() ?? null, []);

  return {
    sessionId,
    messages,
    isAiTyping,
    isConnected,
    isAuthed: isConnected,
    error,
    sendUserMessage,
    close,
    primeAudio,
    interruptAudio,
    getOutputAnalyser,
    streamingMessageId: streamingId,
    speechProgress,
    rewards,
    aiUsedSeconds,
    aiCapSeconds,
    aiLimitReached,
    isAiSpeaking,
    caption,
    mic: {
      open: micOpen,
      starting: micStarting,
      muted,
      transcript,
      error: micError,
      toggleMute,
      getAnalyser,
    },
  };
}
