"use client";

import Link from "next/link";
import { Mic, Puzzle, Sparkles, Target, Wrench, Zap } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// The one thing a learner sees where the AI Partner used to be, for as long as
// the englishconnection-ai-partner flag is off. Shown two ways:
//   • as a popup, when they click any AI Partner link (see useAIPartnerGate)
//   • on /dashboard/ai-partner itself, if they reach the URL directly
// It's deliberately a "coming back better" moment rather than an error — the
// feature isn't broken, it's being upgraded, and the CTAs keep the streak alive.
const HIGHLIGHTS = [
  { Icon: Zap, text: "Quicker, smoother conversations" },
  { Icon: Mic, text: "A far more natural speaking voice" },
  { Icon: Target, text: "Sharper feedback on every reply" },
];

export default function AIPartnerUpdatingModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-md overflow-hidden">
        {/* Glow behind the header — same decorative treatment as the dashboard hero */}
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-25 blur-[70px]"
          style={{ background: "radial-gradient(circle, var(--primary-1), transparent 70%)" }}
        />

        <DialogHeader className="relative">
          <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-primary">
            <Wrench className="h-3.5 w-3.5" strokeWidth={2.5} />
            AI Partner · Upgrading
          </span>
          <DialogTitle className="text-2xl font-extrabold leading-tight text-heading">
            We&apos;re making it a whole lot better
          </DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed">
            Your speaking partner is in the workshop. We&apos;re rebuilding it from the
            ground up so your next conversation feels like talking to a real coach.
          </DialogDescription>
        </DialogHeader>

        <ul className="relative space-y-2.5">
          {HIGHLIGHTS.map(({ Icon, text }) => (
            <li key={text} className="flex items-center gap-2.5 text-sm font-medium text-heading">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-500">
                <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
              </span>
              {text}
            </li>
          ))}
        </ul>

        <div className="relative flex items-center gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3">
          <Sparkles className="h-4 w-4 shrink-0 text-emerald-500" strokeWidth={2.5} />
          <p className="text-sm font-bold text-heading">
            Back in its new form this Friday
          </p>
        </div>

        <p className="relative -mt-1 text-[13px] text-body">
          Nothing is lost — your streak, XP and progress are all exactly where you left them.
          Keep them going in the meantime:
        </p>

        <div className="relative flex flex-col gap-2 sm:flex-row">
          <Link
            href="/dashboard/jumble"
            onClick={onClose}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-bold text-[#0b0e14] transition hover:brightness-105"
          >
            <Puzzle className="h-4 w-4" strokeWidth={2.5} /> Play Jumble Words
          </Link>
          <Link
            href="/dashboard/pronunciation"
            onClick={onClose}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/[0.1] bg-surface-2/60 py-3 text-sm font-bold text-heading transition hover:bg-surface-2"
          >
            <Mic className="h-4 w-4" strokeWidth={2.5} /> Train pronunciation
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
