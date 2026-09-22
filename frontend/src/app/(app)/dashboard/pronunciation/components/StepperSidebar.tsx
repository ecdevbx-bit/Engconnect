"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export type CoachStep = "listen" | "speak" | "feedback" | "improve";

const STEPS: { key: CoachStep; title: string; subtitle: string }[] = [
  { key: "listen", title: "Listen", subtitle: "Hear the sentence" },
  { key: "speak", title: "Speak", subtitle: "Record yourself" },
  { key: "feedback", title: "Feedback", subtitle: "AI analysis" },
  { key: "improve", title: "Improve", subtitle: "Tips & practice" },
];

// Practice-step stepper: a horizontal numbered progress track on mobile (< md)
// where the current step and every previous step stay highlighted, and the
// original vertical list (with subtitles) on tablet/desktop.
export function StepperSidebar({
  current,
  onStepClick,
  id,
}: {
  current: CoachStep;
  onStepClick?: (s: CoachStep) => void;
  id?: string;
}) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);

  return (
    <Card
      id={id}
      className="fixed inset-x-2 bottom-[calc(78px_+_env(safe-area-inset-bottom))] z-30 px-3 py-2 md:static md:px-3 md:py-3"
    >
      {/* Label is desktop-only — on phones the stepper floats above the bottom
          nav, so the heading would just waste vertical space. */}
      <h3 className="hidden px-2 text-sm font-semibold text-heading md:block">Practice steps</h3>

      {/* Mobile (< md): horizontal numbered stepper — title only, connected,
          with cumulative progress so the current step AND every previous step
          stay highlighted (a continuous filled track). */}
      <div className="flex items-start md:hidden">
        {STEPS.map((s, i) => {
          const reached = i <= currentIndex;
          const active = i === currentIndex;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onStepClick?.(s.key)}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <span className="flex w-full items-center">
                {/* left half of the track leading into this step */}
                <span
                  className={cn(
                    "h-0.5 flex-1 rounded-full transition-colors",
                    i === 0
                      ? "opacity-0"
                      : i <= currentIndex
                        ? "bg-primary"
                        : "bg-white/[0.10]",
                  )}
                />
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                    reached
                      ? "bg-primary text-[#0b0e14]"
                      : "bg-white/[0.06] text-muted-foreground",
                    active && "ring-4 ring-primary/20",
                  )}
                >
                  {i + 1}
                </span>
                {/* right half of the track toward the next step */}
                <span
                  className={cn(
                    "h-0.5 flex-1 rounded-full transition-colors",
                    i === STEPS.length - 1
                      ? "opacity-0"
                      : i + 1 <= currentIndex
                        ? "bg-primary"
                        : "bg-white/[0.10]",
                  )}
                />
              </span>
              <span
                className={cn(
                  "text-center text-[11px] font-medium leading-tight transition-colors",
                  active
                    ? "text-primary"
                    : reached
                      ? "text-heading"
                      : "text-muted-foreground",
                )}
              >
                {s.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tablet + desktop (md+): the original vertical stepper with subtitles. */}
      <ol className="mt-2 hidden space-y-0.5 md:block">
        {STEPS.map((s, i) => {
          const active = i === currentIndex;
          const done = i < currentIndex;
          return (
            <li key={s.key}>
              <button
                type="button"
                onClick={() => onStepClick?.(s.key)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors",
                  active && "bg-primary/10",
                  !active && "hover:bg-white/[0.04]",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    active && "bg-primary text-[#0b0e14]",
                    done && !active && "bg-primary/30 text-primary",
                    !active && !done && "bg-white/[0.06] text-muted-foreground",
                  )}
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      active ? "text-primary" : "text-heading",
                    )}
                  >
                    {s.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{s.subtitle}</p>
                </div>
                {active && <span className="ml-auto h-2 w-2 rounded-full bg-primary" />}
              </button>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
