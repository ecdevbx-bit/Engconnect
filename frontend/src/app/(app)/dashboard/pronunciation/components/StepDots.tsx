import { Check, Headphones, Mic } from "lucide-react";

import { cn } from "@/lib/utils";

// Listen → Speak → Result as three icons instead of "Step 1 · Listen" text
// (D-071: pictures over words). The current step is filled.
const STEPS = [
  { key: "listen", icon: Headphones, label: "Listen" },
  { key: "speak", icon: Mic, label: "Speak" },
  { key: "result", icon: Check, label: "Result" },
] as const;

export function StepDots({ current }: { current: "listen" | "speak" | "result" }) {
  const idx = STEPS.findIndex((s) => s.key === current);
  return (
    <ol className="flex items-center justify-center gap-2" aria-label={`Step ${idx + 1} of 3: ${STEPS[idx].label}`}>
      {STEPS.map((s, i) => (
        <li key={s.key} className="flex items-center gap-2" aria-hidden>
          {i > 0 && <span className={cn("h-0.5 w-6 rounded-full", i <= idx ? "bg-speak" : "bg-surface-3")} />}
          <span
            className={cn(
              "grid h-9 w-9 place-items-center rounded-full",
              i === idx ? "bg-speak text-white" : i < idx ? "bg-speak-soft text-speak" : "bg-surface-2 text-muted-foreground",
            )}
          >
            <s.icon className="h-[18px] w-[18px]" />
          </span>
        </li>
      ))}
    </ol>
  );
}
