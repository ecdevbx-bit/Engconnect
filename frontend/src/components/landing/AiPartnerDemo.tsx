"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { ChatBubble } from "@/components/game/ChatBubble";
import { DUMMY_AVATARS } from "@/lib/dummyAvatars";
import { PixelMascot } from "@/components/v3/PixelMascot";
import { SpeechProgressCard } from "@/components/game/aiPartner/SpeechProgressCard";
import type { V3ChatMessage } from "@/hooks/useV3ChatSession";
import {
  NATIVE_LANG_OPTIONS,
  STATUS_OPTIONS,
  REASON_OPTIONS,
  HOBBY_SUGGESTIONS,
} from "@/lib/v3Onboarding";

// Landing showcase for the AI Partner — a looping two-step demo:
//   1) Personalize — the real onboarding form options auto-fill themselves.
//   2) Talk — a scripted conversation types out, the mascot reacting with a
//      different emotion to each reply.

type Line = { role: "user" | "assistant"; time: string; body: string };

// Wording is varied on purpose so the per-message mascot cycles through several
// emotions (greeting → tips → happy → idea → love) via ChatBubble's detectEmotion.
const SCRIPT: Line[] = [
  { role: "assistant", time: "9:41", body: "Hey Aarav! 👋 Welcome — I'm K.AI. What should we work on today?" },
  { role: "user", time: "9:41", body: "I get nervous speaking in meetings." },
  { role: "assistant", time: "9:42", body: "A good way to start: open with \"I'd like to add one quick point.\" Want to try it?" },
  { role: "user", time: "9:42", body: "I would like to add one quick point." },
  { role: "assistant", time: "9:42", body: "Perfect — well done! That was crisp and confident." },
  { role: "assistant", time: "9:43", body: "Here's an idea — let's try it inside a full sentence next." },
  { role: "user", time: "9:43", body: "Sure, let's go!" },
  { role: "assistant", time: "9:43", body: "Wow — you're amazing! 🎉 You're a natural at this." },
];

const STEP_LABELS = ["Personalize", "Talk", "Earn"] as const;
const HOBBIES = HOBBY_SUGGESTIONS.slice(0, 9);

type Picked = { lang: string | null; status: string | null; reason: string | null; hobbies: string[] };
const EMPTY: Picked = { lang: null, status: null, reason: null, hobbies: [] };

// Step 3 — the real "speak to earn" rule (mirrors the admin defaults): cross the
// threshold for the first reward, then a recurring reward every interval. Tuned
// short here so the demo crosses several milestones quickly.
const REWARD = { thresholdSeconds: 8, thresholdXp: 40, recurringInterval: 6, recurringXp: 15 };

// Derive the SpeechProgressCard props from accumulated talk-seconds, the same
// way the live WS `speech_progress` event would.
function rewardProps(talk: number) {
  const { thresholdSeconds, thresholdXp, recurringInterval, recurringXp } = REWARD;
  const milestonesAwarded =
    talk < thresholdSeconds ? 0 : 1 + Math.floor((talk - thresholdSeconds) / recurringInterval);
  const nextMilestoneAt =
    milestonesAwarded === 0 ? thresholdSeconds : thresholdSeconds + milestonesAwarded * recurringInterval;
  const nextMilestoneXp = milestonesAwarded === 0 ? thresholdXp : recurringXp;
  return {
    totalSeconds: talk,
    milestonesAwarded,
    thresholdSeconds,
    thresholdXp,
    recurringInterval,
    recurringXp,
    nextMilestoneAt,
    nextMilestoneXp,
  };
}

export function AiPartnerDemo() {
  const [phase, setPhase] = useState<"personalize" | "chat" | "earn">("personalize");
  const [picked, setPicked] = useState<Picked>(EMPTY);
  const [count, setCount] = useState(0);
  const [typing, setTyping] = useState(false);
  const [talk, setTalk] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => {
      timers.push(setTimeout(() => { if (!cancelled) fn(); }, ms));
    };

    const run = () => {
      setPhase("personalize");
      setPicked(EMPTY);
      setCount(0);
      setTyping(false);
      setTalk(0);

      let t = 700;
      // ── Step 1: the form fills itself in, one field at a time ──
      at(t, () => setPicked((p) => ({ ...p, lang: "Hindi" }))); t += 850;
      at(t, () => setPicked((p) => ({ ...p, status: "working" }))); t += 850;
      at(t, () => setPicked((p) => ({ ...p, reason: "career" }))); t += 850;
      at(t, () => setPicked((p) => ({ ...p, hobbies: ["Cricket"] }))); t += 550;
      at(t, () => setPicked((p) => ({ ...p, hobbies: ["Cricket", "Music"] }))); t += 1300;

      // ── Step 2: switch to chat and type it out ──
      at(t, () => setPhase("chat")); t += 700;
      SCRIPT.forEach((line, i) => {
        if (line.role === "assistant") {
          at(t, () => setTyping(true)); t += 1000;
          at(t, () => { setTyping(false); setCount(i + 1); }); t += 800;
        } else {
          at(t, () => setCount(i + 1)); t += 1200;
        }
      });

      // ── Step 3: rewards — XP awarded as talk-time accrues ──
      at(t + 1400, () => { setPhase("earn"); setTalk(0); });
      at(t + 1400 + 7600, run); // let the XP tick up, then loop back to step 1
    };

    run();
    return () => { cancelled = true; timers.forEach(clearTimeout); };
  }, []);

  // While the rewards step is on screen, tick the talk-timer up so XP visibly
  // accrues across milestones (setState only in the interval callback, never in
  // the effect body).
  useEffect(() => {
    if (phase !== "earn") return;
    const id = setInterval(() => setTalk((s) => s + 1), 200);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [count, typing]);

  const shown: V3ChatMessage[] = SCRIPT.slice(0, count).map((l, i) => ({
    id: String(i),
    role: l.role,
    time: l.time,
    body: l.body,
  }));

  const activeStep = phase === "earn" ? 2 : phase === "chat" ? 1 : 0;

  return (
    <div className="c-box flex h-full flex-col rounded-[28px] p-5">
      <p className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
        AI Partner
      </p>

      {/* Two-step indicator: Personalize → Talk */}
      <div className="mb-4 mt-3 flex shrink-0 items-center justify-center gap-1.5">
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
              <span className={cn("h-px w-5 transition-colors", i < activeStep ? "bg-[#f59e0b]" : "bg-white/10")} />
            )}
          </Fragment>
        ))}
      </div>

      {phase === "personalize" && <PersonalizeForm picked={picked} />}

      {phase === "chat" && (
        <div ref={scrollRef} className="flex flex-1 flex-col gap-5 overflow-y-auto">
          {shown.map((m) => (
            <ChatBubble key={m.id} message={m} userInitial="A" userAvatar={DUMMY_AVATARS[0]} />
          ))}
          {typing && <TypingIndicator />}
        </div>
      )}

      {phase === "earn" && <EarnStep talk={talk} />}
    </div>
  );
}

// Step 3 — rewards. A happy mascot + the real SpeechProgressCard, fed a
// ticking talk-timer so XP visibly racks up as "you speak".
function EarnStep({ talk }: { talk: number }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 overflow-y-auto">
      <PixelMascot emotion="happy" size={72} />
      <p className="text-center text-sm text-muted-foreground">
        The longer you talk, the more XP you earn.
      </p>
      <div className="w-full">
        <SpeechProgressCard {...rewardProps(talk)} />
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </p>
  );
}

// The personalization form — shows the real onboarding options, auto-selecting
// one per field. Just colour/ring transitions, no heavy animation.
function PersonalizeForm({ picked }: { picked: Picked }) {
  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto pr-1">
      <div>
        <FieldLabel>Native language</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {NATIVE_LANG_OPTIONS.map((l) => {
            const on = picked.lang === l.id;
            return (
              <span
                key={l.id}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all",
                  on
                    ? "bg-gradient-to-br from-[#f59e0b] to-[#f97316] text-[#0b0e14]"
                    : "border border-white/[0.06] bg-surface-2 text-muted-foreground",
                )}
              >
                <span className={cn("grid h-4 w-4 place-items-center rounded-full text-[10px]", on ? "bg-[#0b0e14]/20" : "bg-white/10")}>
                  {l.native}
                </span>
                {l.label}
              </span>
            );
          })}
        </div>
      </div>

      <div>
        <FieldLabel>I&apos;m currently</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((s) => {
            const on = picked.status === s.id;
            return (
              <span
                key={s.id}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-all",
                  on
                    ? "bg-gradient-to-br from-[#f59e0b] to-[#f97316] text-[#0b0e14]"
                    : "border border-white/[0.06] bg-surface-2 text-muted-foreground",
                )}
              >
                {s.emoji} {s.label}
              </span>
            );
          })}
        </div>
      </div>

      <div>
        <FieldLabel>Why do you want to learn English?</FieldLabel>
        <div className="grid grid-cols-2 gap-2">
          {REASON_OPTIONS.map((r) => {
            const on = picked.reason === r.id;
            return (
              <div
                key={r.id}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all",
                  on
                    ? "border-primary/50 bg-primary/10 text-heading ring-1 ring-primary/40"
                    : "border-white/[0.06] bg-surface-1/40 text-muted-foreground",
                )}
              >
                <span className="text-base">{r.emoji}</span>
                {r.label}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <FieldLabel>Interests</FieldLabel>
        <div className="flex flex-wrap gap-1.5">
          {HOBBIES.map((h) => {
            const on = picked.hobbies.includes(h);
            return (
              <span
                key={h}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-medium transition-all",
                  on
                    ? "border border-primary/30 bg-primary/15 text-primary"
                    : "border border-white/[0.06] bg-surface-2 text-muted-foreground",
                )}
              >
                {h}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/[0.06] bg-surface-2">
        <PixelMascot isThinking size={48} />
      </div>
      <div className="c-box rounded-[18px] px-5 py-4">
        <span className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/70"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}
