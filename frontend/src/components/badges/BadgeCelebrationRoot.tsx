"use client";

import { useEffect } from "react";

import { useSfx } from "@/hooks/useSfx";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { dismissBadgeCelebration } from "@/store/slices/xpSlice";
import { BadgeCelebrationOverlay } from "@/components/badges/BadgeCelebrationOverlay";

// BadgeCelebrationRoot — single app-wide mount of the badge celebration.
// Reads the FIFO queue in xpSlice; any feature enqueues earned badge IDs via
// enqueueBadgeCelebrations and the head is shown, then popped on dismiss so
// multiple badges from one event play one after another. Level-ups go through
// LevelUpCelebrationRoot instead (and suppress badge celebrations for that
// event — see the gameplay handlers).
export default function BadgeCelebrationRoot() {
  const dispatch = useAppDispatch();
  const queue = useAppSelector((s) => s.xp.badgeQueue);
  const head = queue[0] ?? null;

  // Ding each time a new badge surfaces — including the next one in a streak of
  // multiple awards, since `head` changes as the queue pops.
  const playSfx = useSfx(true);
  useEffect(() => {
    if (head) playSfx("badge");
  }, [head, playSfx]);

  return (
    <BadgeCelebrationOverlay id={head} onDone={() => dispatch(dismissBadgeCelebration())} />
  );
}
