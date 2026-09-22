"use client";

import { cn } from "@/lib/utils";
import { PronunciationDifficulty } from "@/lib/v3Pronunciation";
import { useExhaustedDifficulties } from "@/hooks/useExhaustedDifficulties";

const LEVELS: { key: PronunciationDifficulty; label: string }[] = [
  { key: "easy", label: "Easy" },
  { key: "medium", label: "Medium" },
  { key: "hard", label: "Hard" },
];

export function DifficultyTabs({
  value,
  onChange,
  disabled,
  id,
}: {
  value: PronunciationDifficulty;
  onChange: (d: PronunciationDifficulty) => void;
  disabled?: boolean;
  id?: string;
}) {
  // Difficulties this free user has used up today — flagged with a dot.
  const exhausted = useExhaustedDifficulties("pronunciation");
  return (
    <div id={id} className="inline-flex gap-1 rounded-full bg-surface-2/40 p-1 backdrop-blur-md">
      {LEVELS.map((l) => {
        const active = l.key === value;
        const done = exhausted.includes(l.key);
        return (
          <button
            key={l.key}
            type="button"
            onClick={() => !disabled && onChange(l.key)}
            disabled={disabled}
            title={done ? "Daily free limit reached — go Pro for unlimited" : undefined}
            className={cn(
              "h-8 rounded-full px-4 text-xs font-medium transition-colors",
              active
                ? "bg-primary text-[#0b0e14] shadow-sm"
                : done
                  ? "bg-red-500/10 text-red-600 ring-1 ring-inset ring-red-500/25 dark:text-red-400"
                  : "text-muted-foreground hover:text-heading",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            {l.label}
          </button>
        );
      })}
    </div>
  );
}
