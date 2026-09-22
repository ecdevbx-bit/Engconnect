"use client";

import { useCallback, useEffect, useState } from "react";

import { APP_INSTALLED_EVENT, CAN_INSTALL_EVENT } from "./installCapture";

// Client-side plumbing for "install this site as an app".
//
// Chromium (Chrome/Edge on desktop + Android) fires `beforeinstallprompt` when
// the site meets the install criteria — manifest + service worker + HTTPS, all
// of which we already ship (app/manifest.ts, public/sw.js). Calling
// preventDefault() on that event suppresses the browser's own mini-infobar and
// hands us a one-shot handle we can fire from our own button instead.
//
// The catch: the event lands EARLY, typically before React has hydrated, so a
// listener registered in a useEffect misses it. INSTALL_CAPTURE_SCRIPT (in
// ./installCapture) runs inline at the top of <body> (see app/layout.tsx)
// purely to stash the event on `window` and re-broadcast it as a DOM event this
// hook can pick up whenever it mounts.
//
// WebKit on iOS/iPadOS never fires `beforeinstallprompt` and exposes no
// programmatic install at all — the only route is Share → "Add to Home Screen".
// So iOS gets a how-to card instead of a button; that's the platform, not a gap
// in this code.

/** The Chromium-only install event. Not in lib.dom, so it's declared here. */
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

declare global {
  interface Window {
    __ecInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

/**
 * How the user can install, if at all:
 *  - "prompt" — we hold a live `beforeinstallprompt`; one click does it.
 *  - "ios"    — WebKit: no API, show the Share → Add to Home Screen steps.
 *  - null     — already installed, or a browser with no install path
 *               (Firefox desktop) where a card would just be noise.
 */
export type InstallPlatform = "prompt" | "ios" | null;

export type InstallOutcome = "accepted" | "dismissed" | "unavailable";

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  if (/iphone|ipad|ipod/i.test(navigator.userAgent)) return true;
  // iPadOS 13+ reports a desktop Mac UA; the touch points give it away.
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

/** True once the app is running as an installed app rather than a browser tab. */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const inDisplayMode = (mode: string) => window.matchMedia?.(`(display-mode: ${mode})`).matches;
  if (inDisplayMode("standalone") || inDisplayMode("window-controls-overlay")) return true;
  // iOS Safari predates the display-mode query and uses its own flag.
  return (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function usePwaInstall(): {
  platform: InstallPlatform;
  installed: boolean;
  install: () => Promise<InstallOutcome>;
} {
  // Both start "nothing to offer" so the server render and the first client
  // render agree; the effect below fills in the real state after mount.
  const [platform, setPlatform] = useState<InstallPlatform>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const sync = () => {
      if (isStandalone()) {
        setInstalled(true);
        setPlatform(null);
        return;
      }
      setInstalled(false);
      if (window.__ecInstallPrompt) {
        setPlatform("prompt");
        return;
      }
      setPlatform(isIOS() ? "ios" : null);
    };
    sync();

    const onInstalled = () => {
      setInstalled(true);
      setPlatform(null);
    };
    // Launching the installed app flips display-mode in this tab on desktop.
    const standaloneMq = window.matchMedia("(display-mode: standalone)");

    window.addEventListener(CAN_INSTALL_EVENT, sync);
    window.addEventListener(APP_INSTALLED_EVENT, onInstalled);
    standaloneMq.addEventListener("change", sync);
    return () => {
      window.removeEventListener(CAN_INSTALL_EVENT, sync);
      window.removeEventListener(APP_INSTALLED_EVENT, onInstalled);
      standaloneMq.removeEventListener("change", sync);
    };
  }, []);

  const install = useCallback(async (): Promise<InstallOutcome> => {
    const evt = typeof window === "undefined" ? null : window.__ecInstallPrompt;
    if (!evt) return "unavailable";
    // A deferred prompt is single-use — Chrome rejects a second prompt() on the
    // same event — so drop our handle up front, whatever the user picks. Chrome
    // re-fires `beforeinstallprompt` on a later visit if they said no.
    window.__ecInstallPrompt = null;
    setPlatform(null);
    try {
      await evt.prompt();
      const { outcome } = await evt.userChoice;
      if (outcome === "accepted") setInstalled(true);
      return outcome;
    } catch {
      return "unavailable";
    }
  }, []);

  return { platform, installed, install };
}
