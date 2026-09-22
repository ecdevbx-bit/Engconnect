"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { registerQuotaPromptListener, type QuotaPromptDetail } from "@/lib/quotaPrompt";
import { useIsMobile } from "@/hooks/useIsMobile";
import GoPremiumSheet from "./GoPremiumSheet";
import GoPremiumModal from "./GoPremiumModal";

// App-wide handler for the "daily free quota reached" event. Mounted once in
// providers. On mobile it slides up a bottom sheet; on desktop it opens a modal
// with the feature's Pro card + which difficulties are still free. Registers a
// single module-level listener the API helpers fire via triggerQuotaPrompt.
export default function GoPremiumRoot() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<QuotaPromptDetail>({});

  useEffect(() => {
    registerQuotaPromptListener((d) => {
      setDetail(d);
      setOpen(true);
    });
    return () => registerQuotaPromptListener(null);
  }, []);

  const close = useCallback(() => setOpen(false), []);
  // Mobile sheet's CTA routes to the pro page; desktop modal uses a <Link>.
  const openProMobile = useCallback(() => {
    setOpen(false);
    router.push("/v3/premium");
  }, [router]);

  if (isMobile) {
    return (
      <GoPremiumSheet
        open={open}
        game={detail.game}
        difficulty={detail.difficulty}
        onClose={close}
        onOpenPro={openProMobile}
      />
    );
  }
  return (
    <GoPremiumModal
      open={open}
      game={detail.game}
      difficulty={detail.difficulty}
      onClose={close}
    />
  );
}
