"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Crown, Check, ArrowUpRight } from "lucide-react";
import { remainingDifficulties, type QuotaGame } from "@/lib/quotaPrompt";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Mobile-only "Go Pro" bottom sheet, shown when a free user's daily quota runs
// out. Slides up from the bottom (the reference animation), dims + blurs the
// page behind it, and locks body scroll. Content is ours: the per-game
// free→Pro contrast plus the headline Pro perks. The CTA opens /v3/premium.
const FEATURES = [
  { name: "Jumble Words", free: "18 sentences daily", pro: "4,500 sentences" },
  { name: "Pronunciation", free: "3 sentences daily", pro: "1,500 sentences" },
  { name: "AI Partner", free: "20 min / week", pro: "1 hour / day" },
  { name: "Leaderboard", free: "Top 10 only", pro: "See your rank" },
] as const;

const PERKS = [
  "No daily quota — play unlimited",
  "WhatsApp support",
  "Every game fully unlocked",
] as const;

const GAME_LABEL: Record<string, string> = {
  jumble: "Jumble Words",
  pronunciation: "Pronunciation",
  ai: "AI Partner",
  leaderboard: "Leaderboard",
};

export default function GoPremiumSheet({
  open,
  game,
  difficulty,
  onClose,
  onOpenPro,
}: {
  open: boolean;
  game?: QuotaGame;
  difficulty?: string;
  onClose: () => void;
  onOpenPro: () => void;
}) {
  // Lock body scroll while the sheet is open (reference behaviour). This
  // component only ever renders client-side (GoPremiumRoot gates it behind a
  // post-mount isMobile check), so document is always available here.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const label = game ? GAME_LABEL[game] : "";
  const failed = difficulty ? cap(difficulty) : "";
  const remaining = game ? remainingDifficulties(game) : [];
  const headline = failed
    ? `Your ${failed} ${label || "practice"} is done for today`
    : label
      ? `You've used today's free ${label} plays`
      : "You've used today's free plays";

  return createPortal(
    <div
      className="fixed inset-0 z-[200] md:hidden"
      style={{ pointerEvents: open ? "auto" : "none" }}
      aria-hidden={!open}
    >
      {/* dim + blur overlay */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0 }}
      />

      {/* sheet */}
      <div
        role="dialog"
        aria-modal="true"
        className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-white px-5 pb-8 pt-3 shadow-[0_-12px_44px_rgba(0,0,0,0.28)] dark:bg-[#14171c]"
        style={{
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: "transform 480ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-black/10 dark:bg-white/15" />
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3.5 top-3.5 grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-black/5 dark:hover:bg-white/10"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-5 text-center">
          <span className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm">
            <Crown className="h-6 w-6" />
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight text-heading">Go Pro</h2>
          <p className="mt-1 text-sm text-body">{headline}.</p>
          {remaining.length > 0 && (
            <p className="mt-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Still free today: {remaining.map(cap).join(", ")}
            </p>
          )}
        </div>

        <div className="space-y-2">
          {FEATURES.map((f) => (
            <div
              key={f.name}
              className="flex items-center justify-between rounded-2xl bg-black/[0.03] px-4 py-2.5 dark:bg-white/[0.04]"
            >
              <div className="min-w-0">
                <p className="text-sm font-bold text-heading">{f.name}</p>
                <p className="text-[11px] text-muted-foreground">Free · {f.free}</p>
              </div>
              <span className="shrink-0 whitespace-nowrap rounded-full bg-emerald-500/15 px-3 py-1 text-[12px] font-extrabold text-emerald-600 dark:text-emerald-400">
                {f.pro}
              </span>
            </div>
          ))}
        </div>

        <ul className="mt-4 grid gap-1.5">
          {PERKS.map((p) => (
            <li key={p} className="flex items-center gap-2 text-[13px] text-body">
              <Check className="h-4 w-4 shrink-0 text-emerald-500" /> {p}
            </li>
          ))}
        </ul>

        <button
          onClick={onOpenPro}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#3f9d2c] py-3.5 text-base font-bold text-white shadow-lg transition active:scale-[0.98]"
        >
          See Pro plans <ArrowUpRight className="h-5 w-5" strokeWidth={2.5} />
        </button>
        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          Cancel anytime · free plays reset tomorrow
        </p>
      </div>
    </div>,
    document.body,
  );
}
