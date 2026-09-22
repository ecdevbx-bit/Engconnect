"use client";

// Post-first-login overlay that surfaces the onboarding wizard as a
// dismissible modal. Mounted once inside AppShell so every in-app
// route gets it. Auto-shows when:
//   - the session is authenticated, and
//   - `onboardingCompleted` is false, and
//   - the user hasn't already dismissed it this browser-session.
//
// Dismissal scoped to sessionStorage on purpose — a fresh sign-in or
// new tab gets the prompt again, but a refresh in the same tab does
// not nag.

import { useEffect, useState } from "react";
import { useSession } from "@/lib/session";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";

const DISMISS_KEY = "ec.v3.onboarding.modal.dismissed";

export default function FirstLoginOnboardingModal() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);

  const eligible =
    status === "authenticated" &&
    session?.user?.onboardingCompleted === false;

  // Decide once on mount (and whenever eligibility flips) whether to
  // show the modal. Reading sessionStorage on the server would crash —
  // gated to the effect, which only runs on the client.
  useEffect(() => {
    if (!eligible) {
      setOpen(false);
      return;
    }
    try {
      const dismissed = window.sessionStorage.getItem(DISMISS_KEY) === "true";
      setOpen(!dismissed);
    } catch {
      setOpen(true);
    }
  }, [eligible]);

  const close = () => {
    try { window.sessionStorage.setItem(DISMISS_KEY, "true"); } catch { /* noop */ }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4 py-6 backdrop-blur-sm">
      <OnboardingWizard
        onComplete={close}
        onSkip={close}
        eyebrowOverride="Welcome to English Connection"
      />
    </div>
  );
}
