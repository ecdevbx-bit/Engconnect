"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ProFeatureCard, proFeatureByKey } from "./ProFeatureCards";
import { remainingDifficulties, type QuotaGame } from "@/lib/quotaPrompt";

// Desktop "Go Pro" prompt shown when a free user's daily quota for a difficulty
// runs out. Rather than yanking them to the pro page, it pops the feature's
// actual Pro card and tells them which difficulties are still free today.
const GAME_LABEL: Record<string, string> = {
  jumble: "Jumble Words",
  pronunciation: "Pronunciation",
  ai: "AI Partner",
  leaderboard: "Leaderboard",
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function GoPremiumModal({
  open,
  game,
  difficulty,
  onClose,
}: {
  open: boolean;
  game?: QuotaGame;
  difficulty?: string;
  onClose: () => void;
}) {
  const feature = game ? proFeatureByKey(game) : undefined;
  const remaining = game ? remainingDifficulties(game) : [];
  const failed = difficulty ? cap(difficulty) : "";
  const gameLabel = game ? GAME_LABEL[game] ?? "this" : "this";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold text-heading">
            {failed ? `${failed} practice is done for today` : "Daily free limit reached"}
          </DialogTitle>
          <DialogDescription>
            {remaining.length > 0 ? (
              <>
                Still free today:{" "}
                <span className="font-semibold text-heading">
                  {remaining.map(cap).join(", ")}
                </span>
                . Or unlock unlimited with Pro.
              </>
            ) : (
              <>You&apos;ve used all your free {gameLabel} practice for today — go Pro for unlimited.</>
            )}
          </DialogDescription>
        </DialogHeader>

        {feature && <ProFeatureCard f={feature} href="/v3/premium" />}

        <Link
          href="/v3/premium"
          onClick={onClose}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#3f9d2c] py-3 text-base font-bold text-white shadow-lg transition hover:brightness-105"
        >
          See Pro plans <ArrowUpRight className="h-5 w-5" strokeWidth={2.5} />
        </Link>
      </DialogContent>
    </Dialog>
  );
}
