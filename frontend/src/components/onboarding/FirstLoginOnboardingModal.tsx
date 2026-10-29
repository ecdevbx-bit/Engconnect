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

import { useState } from "react";
import { useSession } from "@/lib/session";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";

const DISMISS_KEY = "ec.v3.onboarding.modal.dismissed";

function dismissedThisTab(): boolean {
  try {
    return typeof window !== "undefined" && window.sessionStorage.getItem(DISMISS_KEY) === "true";
  } catch {
    return false;
  }
}

export default function FirstLoginOnboardingModal() {
  const { data: session, status } = useSession();
  // Read once; sessionStorage only exists in the browser. The session is
  // "loading" on the server, so nothing renders there either way.
  const [dismissed, setDismissed] = useState(dismissedThisTab);

  const open =
    status === "authenticated" &&
    session?.user?.onboardingCompleted === false &&
    !dismissed;

  const close = () => {
    try { window.sessionStorage.setItem(DISMISS_KEY, "true"); } catch { /* noop */ }
    setDismissed(true);
  };

  if (!open) return null;

  return (
    // Full-screen sheet on phones (the footer with Next stays on screen),
    // a centred dialog from sm up.
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Set up your profile"
      className="fixed inset-0 z-50 flex bg-black/65 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"
    >
      <OnboardingWizard
        onComplete={close}
        onSkip={close}
        className="h-[100dvh] rounded-none sm:h-auto sm:max-h-[min(720px,92dvh)] sm:max-w-2xl sm:rounded-2xl"
      />
    </div>
  );
}
