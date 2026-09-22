"use client";

import { useSession } from "@/lib/session";
import { BookMarked } from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import { useWordBankEnabled } from "@/lib/featureFlags";

import { WordBankTrainer } from "./WordBankTrainer";

export default function WordBankPage() {
  const session = useSession();
  const enabled = useWordBankEnabled();
  const accessToken = session.data?.user?.accessToken ?? "";

  // Flag gate. Ships dark: a flat "Coming soon" rather than a 404 for anyone
  // who reaches the URL while the flag is off.
  if (!enabled) {
    return (
      <>
        <PageHeader
          eyebrow="Word Bank"
          title="Coming soon"
          description="The Word Bank isn't enabled on your account yet."
          icon={<BookMarked className="h-5 w-5" />}
        />
      </>
    );
  }

  return accessToken ? (
    <WordBankTrainer accessToken={accessToken} />
  ) : (
    <p className="text-sm text-muted-foreground">Sign in to use your Word Bank.</p>
  );
}
