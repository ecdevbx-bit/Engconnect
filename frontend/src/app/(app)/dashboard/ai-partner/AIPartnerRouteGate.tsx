"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import AIPartnerUpdatingModal from "@/components/game/AIPartnerUpdatingModal";
import V3AIPartner from "@/components/game/V3AIPartner";
import { useAIPartnerGate } from "@/hooks/useAIPartnerGate";

// Backstop for the direct-URL case. The nav surfaces swallow their own clicks
// (useAIPartnerGate), but anyone who types /dashboard/ai-partner, follows an old
// link or restores a tab lands here — so the chat component is never mounted
// while the flag is off; they get the same popup, and dismissing it returns
// them to the dashboard rather than an empty screen.
export default function AIPartnerRouteGate({ lang }: { lang?: string }) {
  const router = useRouter();
  const { blocked, checking } = useAIPartnerGate();

  const leave = useCallback(() => router.replace("/dashboard"), [router]);

  if (checking) {
    return (
      <main className="grid min-h-[50vh] place-items-center px-6 text-sm text-muted-foreground">
        Checking AI Partner access…
      </main>
    );
  }

  if (blocked) return <AIPartnerUpdatingModal open onClose={leave} />;

  return <V3AIPartner nativeLanguage={lang} />;
}
