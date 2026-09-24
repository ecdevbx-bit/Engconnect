import { Lock } from "lucide-react";

import { cn } from "@/lib/utils";

// Small "PRO" pill. `locked` adds a lock for viewers without Pro.
export function ProMark({ locked, className }: { locked?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-black leading-none tracking-tight text-white",
        className,
      )}
      style={{ background: "var(--pro-pill)" }}
      title={locked ? "Pro lesson — free preview" : "Pro lesson"}
    >
      {locked && <Lock className="h-2.5 w-2.5" aria-hidden />}
      PRO
      <span className="sr-only">{locked ? " (locked, preview only)" : " lesson"}</span>
    </span>
  );
}
