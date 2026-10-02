import Link from "next/link";
import { CircleAlert, MessagesSquare, RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";

import { useKaiGuard } from "./kaiGate";
import { primaryButton, secondaryButton } from "./styles";

// Small shared pieces: error / empty states, the "Live" badge, the
// "Summarising…" shimmer and the link that opens K.AI.

export function ErrorState({
  title,
  message,
  onRetry,
  className,
  children,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div role="alert" className={cn("flex flex-col items-center px-4 py-10 text-center", className)}>
      <span className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-destructive/10 text-destructive">
        <CircleAlert className="h-5 w-5" aria-hidden />
      </span>
      <p className="text-base font-bold text-heading">{title}</p>
      <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground break-words">{message}</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {onRetry && (
          <button type="button" onClick={onRetry} className={secondaryButton}>
            <RotateCcw className="h-4 w-4" aria-hidden />
            Retry
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

/** Opens K.AI (respects the AI Partner flag gate). */
export function KaiLink({
  href = "/dashboard/ai-partner",
  className,
  children,
}: {
  href?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const guard = useKaiGuard();
  return (
    <Link href={href} onClick={(e) => guard(e)} className={className}>
      {children}
    </Link>
  );
}

export function EmptyChats() {
  return (
    <div className="c-box flex flex-col items-center rounded-2xl px-6 py-14 text-center">
      <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <MessagesSquare className="h-7 w-7" aria-hidden />
      </span>
      <h2 className="text-lg font-bold text-heading">No conversations yet</h2>
      <p className="mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">
        Have a chat with K.AI — every conversation will be saved here with a summary, your corrections and the new
        words you learned.
      </p>
      <KaiLink className={cn(primaryButton, "mt-6")}>Start a conversation</KaiLink>
    </div>
  );
}

export function LiveBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400",
        className,
      )}
    >
      <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
      Live
    </span>
  );
}

/** Subtle text sweep (reuses the global karaoke-sweep keyframes) in theme colours. */
export function Summarising({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "animate-[karaoke-sweep_2.6s_linear_infinite] bg-[linear-gradient(100deg,var(--body)_38%,var(--heading)_50%,var(--body)_62%)] bg-[length:220%_100%] bg-clip-text font-medium italic text-transparent",
        className,
      )}
    >
      Summarising…
    </span>
  );
}
