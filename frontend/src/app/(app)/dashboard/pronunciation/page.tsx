"use client";

import { useSession } from "@/lib/session";
import { Mic } from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import { usePronunciationEnabled } from "@/lib/featureFlags";

import { PronunciationCoach } from "./PronunciationCoach";

export default function PronunciationPage() {
  const session = useSession();
  const pronunciation = usePronunciationEnabled();
  const accessToken = session.data?.user?.accessToken ?? "";

  // Flag gate. Surface a flat "not available" rather than 404 so a user
  // without the trainer flag sees something useful.
  if (!pronunciation) {
    return (
      <>
        <PageHeader
          eyebrow="Pronunciation"
          title="Coming soon"
          description="The pronunciation trainer isn't enabled on your account yet."
          icon={<Mic className="h-5 w-5" />}
        />
      </>
    );
  }

  // No big PageHeader here — the coach renders Jumble's compact inline
  // title (icon + name + How-to-play) inside its own grid.
  return accessToken ? (
    <PronunciationCoach accessToken={accessToken} />
  ) : (
    <p className="text-sm text-muted-foreground">Sign in to start practicing.</p>
  );
}
