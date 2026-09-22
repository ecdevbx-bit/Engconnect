import { Fragment } from "react";

import { cn } from "@/lib/utils";

// The numbered step pills shown at the top of each landing demo
// ("1 Personalize — 2 Talk — 3 Earn"). Theme-aware: the active step uses the
// primary fill (orange on dark, blue on light), the rest sit on surface-2.
export function DemoSteps({ labels, active }: { labels: readonly string[]; active: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {labels.map((label, i) => (
        <Fragment key={label}>
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors duration-200",
              i === active ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "grid h-4 w-4 place-items-center rounded-full text-[9px] font-bold",
                i === active ? "bg-primary-foreground/20" : "bg-heading/10",
              )}
            >
              {i + 1}
            </span>
            {label}
          </span>
          {i < labels.length - 1 && (
            <span
              className={cn("h-px w-4 transition-colors duration-200 sm:w-5", i < active ? "bg-primary" : "bg-heading/15")}
            />
          )}
        </Fragment>
      ))}
    </div>
  );
}
