"use client";

// SQL hint (developer reference — not rendered):
// Public pronunciation route — uses local sentences, no auth.
// On signup, pronunciation XP submitted via POST /api/auth/sync on first login.

import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";

export default function PublicPronounCoachPage() {
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
          Pronunciation coaching with AI feedback is on the way. Create a free
          account to be first in line.
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link href="/signup">Sign Up Free</Link>
        </Button>
      </div>
    </>
  );
}
