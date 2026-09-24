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

import { useCallback, useEffect, useRef, useState } from "react";

import { MicPcmStream } from "@/audio/micPcmStream";
import { PcmPlayer } from "@/audio/pcmPlayer";
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
// Echo gate: while K.AI's audio plays, a mic frame only counts as the learner
// barging in above this level (RMS 0–1; K.AI's echo after the browser's echo
// cancellation sits well below it). Once they barge in, frames pass for a while.
const BARGE_IN_RMS = 0.05;
const BARGE_HOLD_MS = 1500;
const POLL_MS = 200;
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
};

export function useGeminiLiveSession({
  enabled,
  accessToken,
  nativeLanguage,
  level,
  scenario,
  voice,
}: GeminiLiveOptions): UseV3ChatSessionResult & { mic: LiveMic; isAiSpeaking: boolean } {
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
    userTextRef.current = "";
    userBubbleRef.current = null;
    setTranscript("");
  }, []);

  const commitAssistant = useCallback(() => {
    const a = assistantTextRef.current.trim();
    if (a) remember("assistant", a);
    assistantTextRef.current = "";
    assistantBubbleRef.current = null;
    setStreamingId(null);
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
    mic.gate = (rms) => {
      if (!playerRef.current?.isPlaying()) return true;
      const now = performance.now();
      if (rms > BARGE_IN_RMS) bargeUntilRef.current = now + BARGE_HOLD_MS;
      return now < bargeUntilRef.current;
    };
    try {
      await mic.start((b64) => send({ realtimeInput: { audio: { mimeType: mic.mimeType, data: b64 } } }));
      if (micRef.current !== mic) {
        mic.stop(); // closed/muted while we were waiting for permission
        return;
      }
      setMicOpen(true);
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

  // Release the mic (a held mic keeps Bluetooth headsets in call mode).
  // `announce` tells Gemini the audio paused, so it wraps up the current turn.
  const closeMic = useCallback(
    (announce: boolean) => {
      const mic = micRef.current;
      micRef.current = null;
      mic?.stop();
      if (announce && mic) send({ realtimeInput: { audioStreamEnd: true } });
      setMicOpen(false);
    },
    [send],
  );

  const toggleMute = useCallback(() => {
    if (mutedRef.current) {
      mutedRef.current = false;
      setMuted(false);
      void openMic();
    } else {
      mutedRef.current = true;
      setMuted(true);
      closeMic(true);
    }
  }, [openMic, closeMic]);

  // Socket handlers use only refs + stable callbacks. They are (re)bound in an
  // effect after every render (never during render) so they see fresh closures.
  useEffect(() => {
    handleCloseRef.current = (ev: CloseEvent) => {
      setIsConnected(false);
      clearReplyTimer();
      // The mic reopens once the replacement socket is set up.
      closeMic(false);
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
        userTextRef.current += sc.inputTranscription.text;
        const text = userTextRef.current.trim();
        setTranscript(text);
        if (text) {
          if (!userBubbleRef.current) userBubbleRef.current = crypto.randomUUID();
          upsertBubble(userBubbleRef.current, "user", text);
        }
      }

      // The learner talked over K.AI: Gemini stopped generating — silence the
      // queued audio now and close K.AI's (partial) bubble.
      if (sc.interrupted) {
        playerRef.current?.flush();
        commitAssistant();
      }

      if (sc.modelTurn?.parts) {
        for (const part of sc.modelTurn.parts) {
          const data = part.inlineData?.data;
          if (data && (part.inlineData?.mimeType ?? "").startsWith("audio/")) {
            clearReplyTimer();
            setIsAiTyping(false);
            // K.AI is answering → the learner's utterance is complete.
            if (userTextRef.current) commitUser();
            playerRef.current?.enqueueBase64Pcm(data);
          }
          // Text parts on native-audio models are internal reasoning — never shown.
        }
      }

      if (sc.outputTranscription?.text) {
        clearReplyTimer();
        setIsAiTyping(false);
        if (userTextRef.current) commitUser();
        assistantTextRef.current += sc.outputTranscription.text;
        if (!assistantBubbleRef.current) {
          assistantBubbleRef.current = crypto.randomUUID();
          setStreamingId(assistantBubbleRef.current);
        }
        upsertBubble(assistantBubbleRef.current, "assistant", assistantTextRef.current.trim());
      }

      if (sc.turnComplete) {
        clearReplyTimer();
        setIsAiTyping(false);
        commitTurns();
        reconnectsRef.current = 0; // a healthy exchange resets the retry budget
      }
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
    closeMic(false);
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

    (async () => {
      try {
        const res = await v3Fetch<CreateResponse>("/chat/sessions", accessToken, {
          method: "POST",
          body: { language: nativeLanguage, level, scenario, voice },
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
