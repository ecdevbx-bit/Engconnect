"use client";

// v3 AI partner session lifecycle. Differs from useChatSession in three
// ways:
//   1. Auth is Cognito (accessToken from useSession), not Firebase.
//   2. WebSocket auth happens via the first frame {type:"auth",accessToken}
//      instead of HTTP Bearer (browsers can't set headers on WS upgrade).
//   3. Frame field names are camelCase: sessionID, userMessage.

import { useCallback, useEffect, useRef, useState } from "react";

import { PcmPlayer } from "@/audio/pcmPlayer";
import { speak } from "@/lib/tts";
import {
  v3CreateSession,
  AI_TIME_LIMIT_REACHED_CODE,
  WS_CLOSE_AI_LIMIT,
  type AIPartnerRewards,
  type V3CreateSessionResponse,
} from "@/lib/v3Chat";
import { ApiError } from "@/lib/apiClient";
import { useAppDispatch } from "@/store/hooks";
import { syncFromBackend, setCombo, triggerLevelUp } from "@/store/slices/xpSlice";
import { notifyBadgeAwards } from "@/lib/badgeAward";
import { getSessionId } from "@/lib/sessionId";
import { handleSessionSuperseded } from "@/lib/sessionSupersede";

// WS close code the backend sends when a newer login supersedes this socket
// (matches wsCloseSuperseded in chat_ws.go). Mapped to a sign-out, no reconnect.
const WS_CLOSE_SUPERSEDED = 4001;
const SUPERSEDED_MESSAGE =
  "You've been signed out because your account was opened on another device.";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
const WS_URL = (process.env.NEXT_PUBLIC_WS_URL ?? API_URL.replace(/^http/, "ws")).replace(/\/$/, "");

const LOG = "[v3chat]";
const TEXT_SAFETY_NET_SUFFIX = "/generate-content-text-safety-net";

function stopBrowserSpeech(): void {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

// Auto-reconnect tuning for an unexpectedly dropped socket (ALB idle timeout,
// a network blip, mobile tab backgrounding). We resume the SAME session — its
// history lives server-side and is reloaded from DDB on the next turn — rather
// than killing the conversation, so short drops are invisible to the learner.
const MAX_RECONNECT_ATTEMPTS = 6;
const RECONNECT_BASE_MS = 800;
const RECONNECT_CAP_MS = 8000;

export interface V3ChatMessage {
  id: string;
  role: "user" | "assistant";
  time: string;
  body: string;
}

interface ServerAuthed { type: "authed"; sub: string }
// Sent once per turn when Gemini is reasoning ("thinking"). The reasoning
// text itself is filtered out server-side — this is just a status so the UI
// can show a placeholder instead of the raw chain of thought.
interface ServerAiThinking { type: "ai_thinking" }
interface ServerAiTextDelta { type: "ai_text_delta"; delta: string }
interface ServerAiAudioChunk { type: "ai_audio_chunk"; data: string }
interface ServerAiTurnComplete { type: "ai_turn_complete"; full_text: string; model: string; duration_sec: number }
interface ServerErrorEvent { type: "error"; message: string }
interface ServerResetOk { type: "reset_ok" }
// Sent (then the socket closes) when a stale login is rejected at connect time.
interface ServerSessionSuperseded { type: "session_superseded"; message?: string }
export interface ServerSpeechProgress {
  type: "speech_progress";
  totalSeconds: number;
  prevSeconds: number;
  wordsSpoken: number;
  milestonesAwarded: number;
  thresholdSeconds: number;
  thresholdXp: number;
  recurringInterval: number;
  recurringXp: number;
  nextMilestoneAt: number;
  nextMilestoneXp: number;
  totalXp: number;
  currentLevel: number;
  combo: number;
  xpEarned?: number;
  leveledUp?: boolean;
  newlyEarnedBadges?: string[];
}
type ServerEvent =
  | ServerAuthed
  | ServerAiThinking
  | ServerAiTextDelta
  | ServerAiAudioChunk
  | ServerAiTurnComplete
  | ServerErrorEvent
  | ServerResetOk
  | ServerSessionSuperseded
  | ServerSpeechProgress;

// SpeechProgressState is the slice of progress data the hook surfaces
// to the UI. Reset on every new session.
export interface SpeechProgressState {
  totalSeconds: number;
  wordsSpoken: number;
  milestonesAwarded: number;
  thresholdSeconds: number;
  thresholdXp: number;
  recurringInterval: number;
  recurringXp: number;
  nextMilestoneAt: number;
  nextMilestoneXp: number;
  totalXp: number;
  currentLevel: number;
  combo: number;
  // Stamps an event id whenever a milestone fires, so React effects can
  // trigger a celebration exactly once per award.
  lastMilestoneId: number;
  lastXpEarned: number;
  lastLeveledUp: boolean;
  lastNewBadges: ServerSpeechProgress["newlyEarnedBadges"];
}

function initialProgress(rewards: AIPartnerRewards | null): SpeechProgressState {
  // Pre-fill threshold / recurring from the rewards config the session
  // create returned so the UI shows correct "next reward in N seconds"
  // text BEFORE the first turn lands.
  return {
    totalSeconds: 0,
    wordsSpoken: 0,
    milestonesAwarded: 0,
    thresholdSeconds: rewards?.thresholdSeconds ?? 15,
    thresholdXp: rewards?.thresholdXp ?? 40,
    recurringInterval: rewards?.recurringIntervalSeconds ?? 10,
    recurringXp: rewards?.recurringXp ?? 15,
    nextMilestoneAt: rewards?.thresholdSeconds ?? 15,
    nextMilestoneXp: rewards?.thresholdXp ?? 40,
    totalXp: 0,
    currentLevel: 0,
    combo: 0,
    lastMilestoneId: 0,
    lastXpEarned: 0,
    lastLeveledUp: false,
    lastNewBadges: undefined,
  };
}

function currentTimeLabel() {
  return new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export interface UseV3ChatSessionOptions {
  enabled: boolean;
  accessToken: string | null;
  nativeLanguage?: string;
  level?: string;
}

export interface UseV3ChatSessionResult {
  sessionId: string | null;
  messages: V3ChatMessage[];
  isAiTyping: boolean;
  isConnected: boolean;
  isAuthed: boolean;
  error: string | null;
  sendUserMessage: (text: string) => void;
  close: () => void;
  primeAudio: () => void;
  // Stop K.AI's current voice playback immediately (barge-in). Text keeps
  // streaming; the WebSocket stays open.
  interruptAudio: () => void;
  getOutputAnalyser: () => AnalyserNode | null;
  streamingMessageId: string | null;
  speechProgress: SpeechProgressState;
  // Per-session rewards config returned by the create endpoint. Null
  // until the create response lands. Source of truth for max recording
  // duration on the mic and session length on the timer.
  rewards: AIPartnerRewards | null;
  // AI-Partner daily/weekly time cap. aiUsedSeconds is the seconds already
  // spent before THIS session; aiCapSeconds the window allowance (0 = uncapped).
  // The live "used / cap" timer = aiUsedSeconds + elapsed-this-session.
  aiUsedSeconds: number;
  aiCapSeconds: number;
  // True once the cap is hit — either the session was refused at create time or
  // the socket was closed mid-session (close 4002). Drives the "time's up" view.
  aiLimitReached: boolean;
}

export function useV3ChatSession({
  enabled,
  accessToken,
  nativeLanguage,
  level,
}: UseV3ChatSessionOptions): UseV3ChatSessionResult {
  const dispatch = useAppDispatch();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<V3ChatMessage[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [rewards, setRewards] = useState<AIPartnerRewards | null>(null);
  const [aiUsedSeconds, setAiUsedSeconds] = useState(0);
  const [aiCapSeconds, setAiCapSeconds] = useState(0);
  const [aiLimitReached, setAiLimitReached] = useState(false);
  const [speechProgress, setSpeechProgress] = useState<SpeechProgressState>(() =>
    initialProgress(null),
  );

  const wsRef = useRef<WebSocket | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const assistantBubbleIdRef = useRef<string | null>(null);
  // How many assistant turns we're still awaiting an `ai_turn_complete` for.
  // Bumped on every `start`/`turn` we send, decremented on each completion.
  // Lets us detect a STALE completion: if the user already fired the next turn
  // (count still > 0 after decrement) before the previous turn's completion
  // lands, that late completion must NOT re-inject its full_text — the text
  // already streamed in, so injecting it again prints a duplicate bubble.
  const inflightTurnsRef = useRef(0);
  const closedManuallyRef = useRef(false);
  const playerRef = useRef<PcmPlayer | null>(null);
  if (playerRef.current === null) playerRef.current = new PcmPlayer();
  // When the learner taps the mic to talk over K.AI, we stop playing the
  // current turn's voice AND drop any further audio chunks for that turn —
  // while letting its TEXT keep streaming in. Reset when the user's next turn
  // is sent. The WebSocket is never touched (barge-in is a local-audio concern).
  const suppressAudioRef = useRef(false);
  // Latest access token, mirrored into a ref so a reconnect's auth frame uses a
  // token that may have been refreshed while the socket was down — without
  // adding it to the connect effect's deps (which would tear the session down).
  const accessTokenRef = useRef(accessToken);
  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);
  // Reconnect bookkeeping: current attempt count (reset to 0 on a healthy auth)
  // and the pending backoff timer so it can be cancelled on manual close/unmount.
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const close = useCallback(() => {
    closedManuallyRef.current = true;
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    const ws = wsRef.current;
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      ws.close();
    }
    wsRef.current = null;
    setIsConnected(false);
    setIsAuthed(false);
    setIsAiTyping(false);
    playerRef.current?.stop();
    stopBrowserSpeech();
  }, []);

  const appendAssistantDelta = useCallback((delta: string) => {
    let id = assistantBubbleIdRef.current;
    const isNew = !id;
    if (isNew) {
      id = crypto.randomUUID();
      assistantBubbleIdRef.current = id;
      setStreamingId(id);
    }
    const bubbleId = id!;
    const time = currentTimeLabel();
    setMessages((prev) => {
      const existing = prev.find((m) => m.id === bubbleId);
      if (existing) {
        return prev.map((m) => (m.id === bubbleId ? { ...m, body: m.body + delta } : m));
      }
      return [...prev, { id: bubbleId, role: "assistant", time, body: delta }];
    });
  }, []);

  const handleEvent = useCallback(
    (event: ServerEvent) => {
      switch (event.type) {
        case "authed":
          setIsAuthed(true);
          break;
        case "ai_thinking":
          // Keep the "thinking…" placeholder up while the model reasons.
          setIsAiTyping(true);
          break;
        case "ai_text_delta":
          if (event.delta) {
            setIsAiTyping(false);
            appendAssistantDelta(event.delta);
          }
          break;
        case "ai_audio_chunk":
          // Dropped while the user is barging in — text still streams in above.
          if (!suppressAudioRef.current) playerRef.current?.enqueueBase64Pcm(event.data);
          break;
        case "ai_turn_complete": {
          inflightTurnsRef.current = Math.max(0, inflightTurnsRef.current - 1);
          // A newer turn is already in flight → this completes a SUPERSEDED
          // turn whose text already streamed in. Ignore it: don't re-inject
          // full_text (that's the duplicate-bubble bug) and don't touch the
          // live turn's streaming state.
          if (inflightTurnsRef.current > 0) break;
          setIsAiTyping(false);
          setStreamingId(null);
          if (!assistantBubbleIdRef.current && event.full_text) {
            const id = crypto.randomUUID();
            setMessages((prev) => [
              ...prev,
              { id, role: "assistant", time: currentTimeLabel(), body: event.full_text },
            ]);
          }
          // Vertex Live occasionally completes a turn with zero audio and text.
          // The backend labels its normal-generation safety-net response so the
          // learner still hears it rather than getting an unexpected text-only
          // turn. This is deliberately limited to that path: native Gemini PCM
          // remains the voice source for every normal Live response.
          if (
            event.full_text &&
            event.model.endsWith(TEXT_SAFETY_NET_SUFFIX) &&
            !suppressAudioRef.current
          ) {
            speak(event.full_text);
          }
          assistantBubbleIdRef.current = null;
          break;
        }
        case "speech_progress":
          setSpeechProgress((prev) => ({
            totalSeconds: event.totalSeconds,
            wordsSpoken: event.wordsSpoken,
            milestonesAwarded: event.milestonesAwarded,
            thresholdSeconds: event.thresholdSeconds,
            thresholdXp: event.thresholdXp,
            recurringInterval: event.recurringInterval,
            recurringXp: event.recurringXp,
            nextMilestoneAt: event.nextMilestoneAt,
            nextMilestoneXp: event.nextMilestoneXp,
            totalXp: event.totalXp,
            currentLevel: event.currentLevel,
            combo: event.combo,
            // Bump the milestone id only on actual awards so an effect
            // watching this field can fire celebrations exactly once per
            // crossed boundary. Non-award progress pings keep the same id.
            lastMilestoneId:
              event.xpEarned && event.xpEarned > 0
                ? prev.lastMilestoneId + 1
                : prev.lastMilestoneId,
            lastXpEarned: event.xpEarned ?? 0,
            lastLeveledUp: event.leveledUp ?? false,
            lastNewBadges: event.newlyEarnedBadges,
          }));
          // Only sync Redux on actual XP awards — non-award progress pings
          // (tick updates of totalSeconds) leave totalXp unchanged, so
          // skipping them avoids needless re-renders of every XP/Level
          // consumer (notably the navbar).
          if (event.xpEarned && event.xpEarned > 0) {
            dispatch(syncFromBackend({ totalXp: event.totalXp, currentLevel: event.currentLevel }));
            dispatch(setCombo({ category: "ai-partner", value: event.combo }));
            // Level-up shows its own card alone; otherwise queue any
            // newly-earned badge celebrations.
            if (event.leveledUp) {
              dispatch(triggerLevelUp(event.currentLevel));
            } else {
              notifyBadgeAwards(dispatch, event.newlyEarnedBadges);
            }
          }
          break;
        case "error":
          inflightTurnsRef.current = Math.max(0, inflightTurnsRef.current - 1);
          setError(event.message);
          setIsAiTyping(false);
          break;
        case "reset_ok":
          break;
      }
    },
    [appendAssistantDelta, dispatch],
  );

  useEffect(() => {
    if (!enabled || !accessToken) return;

    let cancelled = false;
    closedManuallyRef.current = false;
    reconnectAttemptRef.current = 0;

    // openSocket wires a fresh WebSocket for the CURRENT session id. On the
    // FIRST open it sends {type:"start"} to trigger K.AI's greeting; on a
    // reconnect it does NOT (the session already greeted). History lives
    // server-side (reloaded from DDB each turn), so resuming needs only a
    // re-auth — the conversation continues where it left off.
    function openSocket(isReconnect: boolean) {
      const sid = sessionIdRef.current;
      if (!sid || cancelled || closedManuallyRef.current) return;

      const wsUrl = `${WS_URL}/ws/chat`;
      console.log(`${LOG} opening WS →`, wsUrl, isReconnect ? "(reconnect)" : "");
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled || closedManuallyRef.current) return;
        setIsConnected(true);
        // Step 1: authenticate. Server replies with {type:"authed"}. The sid
        // proves this is the account's current login (single-active-session).
        // Use the ref so a token refreshed during a drop is picked up.
        ws.send(
          JSON.stringify({ type: "auth", accessToken: accessTokenRef.current ?? "", sid: getSessionId() }),
        );
      };

      ws.onmessage = (evt) => {
        try {
          const parsed = JSON.parse(evt.data) as ServerEvent;
          console.log(`${LOG} WS ←`, parsed.type, parsed);
          // Stale login rejected at connect — sign out, don't reconnect.
          if (parsed.type === "session_superseded") {
            closedManuallyRef.current = true;
            setError(SUPERSEDED_MESSAGE);
            handleSessionSuperseded();
            return;
          }
          handleEvent(parsed);
          if (parsed.type === "authed") {
            // Healthy again — clear the backoff counter and any stale error.
            reconnectAttemptRef.current = 0;
            setError(null);
            if (isReconnect) {
              // Resuming: drop any turn state stranded by the drop (a reply that
              // was mid-flight when the socket died won't arrive) so the UI isn't
              // stuck "thinking", and DON'T re-greet.
              inflightTurnsRef.current = 0;
              assistantBubbleIdRef.current = null;
              setIsAiTyping(false);
              setStreamingId(null);
            } else {
              // First connect → kick off the AI greeting.
              setIsAiTyping(true);
              inflightTurnsRef.current += 1;
              ws.send(JSON.stringify({ type: "start", sessionID: sid }));
            }
          }
        } catch (err) {
          console.warn(`${LOG} bad WS frame`, err, evt.data);
        }
      };

      ws.onerror = (evt) => {
        // Don't surface an error here: onerror is always followed by onclose,
        // which decides whether to silently reconnect. Flashing an error on a
        // transient blip we're about to heal would be misleading.
        console.error(`${LOG} WS error`, evt);
      };

      ws.onclose = (evt) => {
        console.log(`${LOG} WS close`, evt.code, evt.reason);
        setIsConnected(false);
        setIsAuthed(false);
        setIsAiTyping(false);
        // Heartbeat dropped us because a newer login took over — sign out
        // and stay closed (don't reconnect).
        if (evt.code === WS_CLOSE_SUPERSEDED) {
          closedManuallyRef.current = true;
          setError(SUPERSEDED_MESSAGE);
          handleSessionSuperseded();
          return;
        }
        // Cap reached mid-session — server ended the socket. Show "time's up".
        if (evt.code === WS_CLOSE_AI_LIMIT) {
          closedManuallyRef.current = true;
          setAiLimitReached(true);
          return;
        }
        // Any other close is unexpected (ALB idle timeout, network blip, mobile
        // backgrounding): resume the SAME session with backoff instead of
        // killing it. Skipped if we closed on purpose or the effect is tearing
        // down.
        if (!cancelled && !closedManuallyRef.current) {
          scheduleReconnect();
        }
      };
    }

    function scheduleReconnect() {
      if (reconnectAttemptRef.current >= MAX_RECONNECT_ATTEMPTS) {
        setError("Connection to K.AI was lost. Please tap the mic to reconnect.");
        return;
      }
      const attempt = reconnectAttemptRef.current++;
      const delay = Math.min(RECONNECT_CAP_MS, RECONNECT_BASE_MS * Math.pow(1.7, attempt));
      console.log(`${LOG} scheduling reconnect #${attempt + 1} in ${Math.round(delay)}ms`);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = setTimeout(() => {
        if (cancelled || closedManuallyRef.current) return;
        openSocket(true);
      }, delay);
    }

    async function connect() {
      console.log(`${LOG} connect() — API_URL=${API_URL} WS_URL=${WS_URL}`);
      try {
        const sess: V3CreateSessionResponse = await v3CreateSession(accessToken!, {
          language: nativeLanguage,
          level: level,
        });
        if (cancelled) return;
        setSessionId(sess.sessionID);
        sessionIdRef.current = sess.sessionID;
        setRewards(sess.rewards);
        setAiUsedSeconds(sess.aiUsedSeconds ?? 0);
        setAiCapSeconds(sess.aiCapSeconds ?? 0);
        setSpeechProgress(initialProgress(sess.rewards));
        // Fresh session → no turns outstanding, no stale assistant bubble.
        inflightTurnsRef.current = 0;
        assistantBubbleIdRef.current = null;

        openSocket(false);
      } catch (err) {
        if (cancelled) return;
        console.error(`${LOG} connect() failed`, err);
        // Session refused because the AI-time window is spent — show the
        // "time's up" view, not a generic connection error.
        if (err instanceof ApiError && err.code === AI_TIME_LIMIT_REACHED_CODE) {
          closedManuallyRef.current = true;
          setAiLimitReached(true);
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to start session");
      }
    }

    void connect();

    return () => {
      cancelled = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, accessToken]);

  const sendUserMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    const ws = wsRef.current;
    const id = sessionIdRef.current;
    if (!trimmed || !ws || ws.readyState !== WebSocket.OPEN || !id) return;

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", time: currentTimeLabel(), body: trimmed },
    ]);
    setIsAiTyping(true);
    assistantBubbleIdRef.current = null;
    setStreamingId(null);
    // New turn → let K.AI's reply be heard again (clears any prior barge-in).
    suppressAudioRef.current = false;
    inflightTurnsRef.current += 1;

    ws.send(JSON.stringify({ type: "turn", sessionID: id, userMessage: trimmed }));
  }, []);

  const primeAudio = useCallback(() => {
    playerRef.current?.prime();
  }, []);

  // Barge-in: silence K.AI's voice immediately (text keeps printing) and ignore
  // the rest of this turn's audio. Does NOT close the WebSocket — the session,
  // its timer/rewards, and the streaming text all continue.
  const interruptAudio = useCallback(() => {
    suppressAudioRef.current = true;
    playerRef.current?.flush();
    stopBrowserSpeech();
  }, []);

  const getOutputAnalyser = useCallback(
    () => playerRef.current?.getAnalyser() ?? null,
    [],
  );

  return {
    sessionId,
    messages,
    isAiTyping,
    isConnected,
    isAuthed,
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
  };
}
