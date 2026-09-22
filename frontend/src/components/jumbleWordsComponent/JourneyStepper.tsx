"use client";

import { FaCheck } from "react-icons/fa";
import { cn } from "@/lib/utils";

// Progressive variants escalate easy → medium → hard; the journey shows that
// one set (3 stage nodes), not the 6-question batch. Variants beyond #3 keep
// the "Hard" node active — further escalations of the same sentence.
const STAGE_STYLES = [
  {
    label: "Easy",
    done: "bg-emerald-500 text-[#0b0e14]",
    active: "bg-emerald-500/20 text-emerald-700 ring-2 ring-emerald-600/60 anim-flame dark:bg-emerald-500/15 dark:text-emerald-400 dark:ring-emerald-500/50",
    todo: "bg-surface-3 text-emerald-700/80 dark:text-emerald-400/60",
  },
  {
    label: "Medium",
    done: "bg-amber-500 text-[#0b0e14]",
    active: "bg-amber-500/20 text-amber-700 ring-2 ring-amber-600/60 anim-flame dark:bg-amber-500/15 dark:text-amber-400 dark:ring-amber-500/50",
    todo: "bg-surface-3 text-amber-700/80 dark:text-amber-400/60",
  },
  {
    label: "Hard",
    done: "bg-red-500 text-[#0b0e14]",
    active: "bg-red-500/20 text-red-700 ring-2 ring-red-600/60 anim-flame dark:bg-red-500/15 dark:text-red-400 dark:ring-red-500/50",
    todo: "bg-surface-3 text-red-700/80 dark:text-red-400/60",
  },
] as const;

/**
 * JourneyStepper — the per-question progress "journey" (Journey & Audio bundle).
 * Replaces the plain progress bar with a path of step nodes: done nodes are
 * filled with the accent gradient, the current node pulses, the rest are dim.
 *
 * `stageVariant` (progressive band only) is the CURRENT question's variant
 * number. When present the journey renders one set — Easy → Medium → Hard —
 * with stages before the variant done, the variant active, and the rest
 * ahead. It resets naturally when the next base's variant #1 arrives.
 */
export default function JourneyStepper({
  total,
  current,
  stageVariant,
}: {
  total: number;
  current: number;
  stageVariant?: number;
}) {
  if (stageVariant != null) {
    const activeIdx = Math.min(Math.max(stageVariant, 1), 3) - 1;
    return (
      <div className="flex w-full items-center">
        {STAGE_STYLES.map((stage, i) => {
          const done = i < activeIdx;
          const active = i === activeIdx;
          return (
            <div key={stage.label} className="flex flex-1 items-center last:flex-none">
              <div
                className={cn(
                  "flex h-6 shrink-0 items-center gap-1 rounded-full px-2.5 text-[10px] font-bold transition-all duration-300",
                  done && stage.done,
                  active && stage.active,
                  !done && !active && stage.todo,
                )}
              >
                {done && <FaCheck className="text-[8px]" />}
                {stage.label}
              </div>
              {i < STAGE_STYLES.length - 1 && (
                <div
                  className={cn(
                    "h-[3px] flex-1 rounded-full transition-colors duration-300",
                    done ? "bg-primary" : "bg-surface-3"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex w-full items-center">
      {Array.from({ length: total }).map((_, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex flex-1 items-center last:flex-none">
            <div
              className={cn(
                "grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold transition-all duration-300",
                done &&
                  "bg-gradient-to-br from-[#f59e0b] to-[#f97316] text-[#0b0e14]",
                active &&
                  "bg-primary/20 text-primary ring-2 ring-primary/50 anim-flame",
                !done && !active && "bg-surface-3 text-muted-foreground"
              )}
            >
              {done ? <FaCheck className="text-[9px]" /> : i + 1}
            </div>
            {i < total - 1 && (
              <div
                className={cn(
                  "h-[3px] flex-1 rounded-full transition-colors duration-300",
                  done ? "bg-primary" : "bg-surface-3"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
