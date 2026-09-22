"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Mic, Zap } from "lucide-react";

import { Card } from "@/components/ui/card";

// SpeechProgressCard — shows progress toward the user's next XP
// milestone within the current chat session.
//
// Driven by the WS `speech_progress` event:
//   totalSeconds       — cumulative spoken time this session
//   milestonesAwarded  — how many milestones already credited
//   thresholdSeconds   — seconds required to cross the first milestone
//   recurringInterval  — seconds between subsequent milestones
//   thresholdXp        — XP for the first milestone
//   recurringXp        — XP for milestones 2..N
//   nextMilestoneAt    — cumulative-second mark of the next reward
//   nextMilestoneXp    — XP the next reward will pay
//
// Total session XP = (milestonesAwarded >= 1 ? thresholdXp : 0)
//                  + max(0, milestonesAwarded - 1) * recurringXp

function formatMmSs(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function computeSessionXp(awarded: number, thresholdXp: number, recurringXp: number) {
  if (awarded <= 0) return 0;
  if (awarded === 1) return thresholdXp;
  return thresholdXp + (awarded - 1) * recurringXp;
}

export function SpeechProgressCard({
  totalSeconds,
  milestonesAwarded,
  thresholdSeconds,
  thresholdXp,
  recurringInterval,
  recurringXp,
  nextMilestoneAt,
  nextMilestoneXp,
  header,
  compact,
}: {
  totalSeconds: number;
  milestonesAwarded: number;
  thresholdSeconds: number;
  thresholdXp: number;
  recurringInterval: number;
  recurringXp: number;
  nextMilestoneAt: number;
  nextMilestoneXp: number;
  // Optional content rendered at the top of the card (the AI mascot + style toggle).
  header?: ReactNode;
  // Phones: a single-row horizontal card (Time · Earned · Next reward) instead of
  // the tall full card. No mascot header.
  compact?: boolean;
}) {
  // Width of the segment the progress bar is filling. Pre-threshold:
  // the full threshold. Post-threshold: one recurring interval.
  const segmentLength =
    milestonesAwarded === 0 ? Math.max(1, thresholdSeconds) : Math.max(1, recurringInterval);
  const segmentStart =
    milestonesAwarded === 0 ? 0 : nextMilestoneAt - recurringInterval;
  const into = Math.max(0, Math.min(segmentLength, totalSeconds - segmentStart));
  const pct = Math.min(100, Math.round((into / segmentLength) * 100));
  const secsToNext = Math.max(0, nextMilestoneAt - totalSeconds);
  const sessionXp = computeSessionXp(milestonesAwarded, thresholdXp, recurringXp);

  if (compact) {
    return (
      <Card className="px-3 py-1">
        <div className="flex items-center gap-3 text-center">
          <div className="flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Time
            </p>
            <p className="font-display text-base font-bold tabular-nums text-heading">
              {formatMmSs(totalSeconds)}
            </p>
          </div>
          <div className="h-8 w-px shrink-0 bg-white/[0.07]" />
          <div className="flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Earned
            </p>
            <p className="font-display text-base font-bold text-heading">+{sessionXp} XP</p>
          </div>
          <div className="h-8 w-px shrink-0 bg-white/[0.07]" />
          <div className="min-w-0 flex-[1.5]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Next reward
            </p>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
              <div
                className="h-1.5 rounded-full bg-gradient-to-r from-primary-1 to-primary-2 transition-[width]"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1 truncate text-[10px] text-muted-foreground">
              {secsToNext > 0
                ? `${secsToNext}s → +${nextMilestoneXp} XP`
                : `+${nextMilestoneXp} XP unlocked!`}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      {header && (
        <div className="mb-3 border-b border-white/[0.06] pb-3">{header}</div>
      )}
      <h3 className="px-2 text-sm font-semibold text-heading">Speak to earn</h3>

      <div className="mt-3 grid grid-cols-2 gap-2 px-2">
        <div className="rounded-lg border border-white/[0.04] bg-surface-2/40 px-3 py-2">
          <div className="flex items-center gap-1.5 text-xs text-primary">
            <Mic className="h-3.5 w-3.5" />
            <span className="uppercase tracking-[0.14em] text-muted-foreground">
              Time spoken
            </span>
          </div>
          <p className="mt-1 font-display text-lg font-bold text-heading">
            {formatMmSs(totalSeconds)}
          </p>
        </div>
        <motion.div
          key={sessionXp}
          initial={{ opacity: 0.6, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="rounded-lg border border-white/[0.04] bg-surface-2/40 px-3 py-2"
        >
          <div className="flex items-center gap-1.5 text-xs text-emerald-300">
            <Zap className="h-3.5 w-3.5" />
            <span className="uppercase tracking-[0.14em] text-muted-foreground">
              Earned
            </span>
          </div>
          <p className="mt-1 font-display text-lg font-bold text-heading">
            +{sessionXp} XP
          </p>
        </motion.div>
      </div>

      <div className="mt-4 px-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {milestonesAwarded === 0 ? "First reward" : "Next reward"}
          </span>
          <span>
            {formatMmSs(Math.max(0, totalSeconds - segmentStart))} /{" "}
            {formatMmSs(segmentLength)}
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-3">
          <motion.div
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ type: "spring", stiffness: 110, damping: 24 }}
            className="h-2 rounded-full bg-gradient-to-r from-primary-1 to-primary-2"
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {secsToNext > 0
            ? `Speak ${secsToNext}s more to earn +${nextMilestoneXp} XP`
            : `+${nextMilestoneXp} XP unlocked — keep going!`}
        </p>
      </div>
    </Card>
  );
}
