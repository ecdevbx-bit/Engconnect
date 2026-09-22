"use client";

// SQL hint (developer reference — not rendered):
// Pronunciation session start: POST /api/game/pronoun-coach/start
//   → SELECT s.id, s.text, s.difficulty FROM sentences s
//     WHERE s.type = 'pronunciation' AND s.difficulty = ? LIMIT 3
// Session complete: POST /api/game/pronoun-coach/complete
//   → INSERT INTO activities (user_id, activity_type, xp_earned, activity_data, created_at) VALUES (...)
//   → UPDATE users SET total_xp = total_xp + ?, current_level = ? WHERE id = ?

import PageHeader from "@/components/layout/PageHeader";
import { Mic } from "lucide-react";

export default function AuthedPronounCoachPage() {
  return (
    <>
      <PageHeader
        eyebrow="Game"
        title="Pronoun Coach"
        description="Pronunciation coaching with real-time AI feedback."
        icon={<Mic className="h-5 w-5" />}
      />
      <div className="c-box rounded-xl p-12 text-center">
        <div className="mb-3 text-4xl">🎤</div>
        <p className="mb-1 font-semibold text-heading">Coming soon</p>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          Pronunciation coaching with AI feedback is on the way.
        </p>
      </div>
    </>
  );
}
