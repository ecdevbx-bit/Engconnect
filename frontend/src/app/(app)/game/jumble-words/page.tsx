"use client";

// SQL hint (developer reference — not rendered):
// Public route — no auth required, no backend calls.
// Sentences served from local pool (src/data/sentences.ts).
// On signup from completion card, XP is submitted to:
//   POST /api/auth/sync → upsert user in DB; then game XP applied client-side

import { PublicJumbleWordsPlayground } from "@/components/game/PublicJumbleWordsPlayground";
import PageHeader from "@/components/layout/PageHeader";
import { Puzzle } from "lucide-react";

export default function PublicJumbleWordsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Game"
        title="Jumble Words"
        description="Try the sentence-building game — no account needed."
        icon={<Puzzle className="h-5 w-5" />}
      />
      <PublicJumbleWordsPlayground />
    </>
  );
}
