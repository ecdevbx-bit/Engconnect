"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import AiCoachMascot from "./AiCoachMascot";

type Feedback = "correct" | "wrong" | null;

/**
 * CoachFeedbackCard — the phones-only replacement for the persistent AI Coach
 * rail (which is `hidden md:flex` on small screens). Instead of always sitting
 * in the layout, the coach pops up as a disposable card only when the player
 * submits a sentence: a happy mascot + praise on a correct answer, a sad mascot
 * + nudge on a wrong one. Nothing shows while the player is still building.
 *
 * It latches the reaction and keeps it on screen for 3s, independent of when
 * MainLayout clears `feedback` (which resets in ~1–1.65s), so the message has
 * time to read. Layout mirrors JumbleHintCard's pop card.
 */
const SHOW_MS = 3000;

export default function CoachFeedbackCard({
  feedback,
  message,
}: {
  feedback: Feedback;
  message: string;
}) {
  const [shown, setShown] = useState<{ feedback: "correct" | "wrong"; message: string } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Latch each new submit reaction and hold it for SHOW_MS. We only react when
  // `feedback` becomes non-null — the parent resetting it to null must NOT hide
  // the card early, so there's no cleanup tied to the dep change here.
  useEffect(() => {
    if (!feedback) return;
    setShown({ feedback, message });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setShown(null), SHOW_MS);
  }, [feedback, message]);

  // Clear the pending timer only on unmount (e.g. the hint card takes over), so
  // we never call setState on an unmounted component.
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  if (!shown) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[55] flex items-center justify-center p-4 md:hidden">
      <div className="c-box animate-in fade-in zoom-in-95 w-full max-w-xs rounded-3xl p-5 text-center shadow-[0_24px_80px_rgba(0,0,0,0.6)] duration-200">
        <div className="mb-1 flex justify-center">
          <AiCoachMascot feedback={shown.feedback} size={88} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">AI Coach</p>
        <p
          className={cn(
            "mt-2 text-sm font-medium",
            shown.feedback === "correct" ? "text-[#22c55e]" : "text-[#ef4444]",
          )}
        >
          {shown.message}
        </p>
      </div>
    </div>
  );
}
