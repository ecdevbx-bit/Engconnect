"use client";

import { useCallback, useEffect, useState } from "react";

import { registerAIPartnerNoticeListener } from "@/lib/aiPartnerGate";
import AIPartnerUpdatingModal from "./AIPartnerUpdatingModal";

// App-wide host for the "AI Partner is being upgraded" popup. Mounted once in
// providers so any blocked link anywhere — navbar tab, bottom nav, dashboard
// card, landing slider — can open it without each surface owning a modal.
export default function AIPartnerGateRoot() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    registerAIPartnerNoticeListener(() => setOpen(true));
    return () => registerAIPartnerNoticeListener(null);
  }, []);

  return <AIPartnerUpdatingModal open={open} onClose={close} />;
}
