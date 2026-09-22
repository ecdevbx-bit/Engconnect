"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/session";
import { Download, Share, SquarePlus, X, Zap, WifiOff, Maximize2 } from "lucide-react";

import { usePwaInstall } from "./usePwaInstall";

// App-wide "install this as an app" nudge, mounted once in providers so it can
// appear on the marketing site and inside the product alike.
//
// It surfaces on a short delay after each arrival (and again right after a
// sign-in, since `status` re-arms the timer) but never nags: dismissing it —
// or declining the browser's own dialog — snoozes it for SNOOZE_DAYS, and it
// disappears for good once the app is installed. Browsers with no install path
// (Firefox desktop) never see it: usePwaInstall reports platform === null.

const SNOOZE_KEY = "ec:pwa-install-snoozed-until";
const SNOOZE_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;
// Long enough that the card never competes with first paint or a page
// transition, short enough that it still lands within the first screen.
const SHOW_DELAY_MS = 4000;

// The auth screens are the one place this must stay out of the way — a card
// over a half-typed password is hostile, and the post-login redirect gives us
// a better moment a few seconds later anyway.
const SUPPRESSED_PATHS = ["/login", "/signup", "/not-signed-in"];

function isSnoozed(): boolean {
  try {
    const until = Number(window.localStorage.getItem(SNOOZE_KEY) ?? 0);
    return Number.isFinite(until) && Date.now() < until;
  } catch {
    return false; // private mode: no memory, but showing once is better than never
  }
}

function snooze() {
  try {
    window.localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_DAYS * DAY_MS));
  } catch {
    // Storage unavailable — the card just reappears next visit.
  }
}

const BENEFITS = [
  { Icon: Maximize2, text: "Full screen — no browser bars" },
  { Icon: Zap, text: "Opens straight from your home screen" },
  { Icon: WifiOff, text: "Still opens when you're offline" },
] as const;

export default function InstallAppPrompt() {
  const { status } = useSession();
  const pathname = usePathname();
  const { platform, installed, install } = usePwaInstall();
  // `armed` flips only from the reveal timer, `dismissed` only from a click —
  // visibility is derived from them rather than assigned in an effect, so
  // nothing here triggers a cascading render.
  const [armed, setArmed] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  // Drives the slide-in: mount hidden, flip on the next frame so the browser
  // has a "from" state to animate out of.
  const [shown, setShown] = useState(false);

  const suppressed = SUPPRESSED_PATHS.some(
    (p) => pathname === p || pathname?.startsWith(`${p}/`),
  );
  const visible = armed && !dismissed && !installed && !!platform && !suppressed;

  useEffect(() => {
    if (installed || !platform || suppressed || isSnoozed()) return;
    const timer = setTimeout(() => setArmed(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
    // `status` is a dependency on purpose: signing in re-arms the delay so the
    // card gets its moment on the dashboard the user just landed on.
  }, [platform, installed, suppressed, status]);

  useEffect(() => {
    if (!visible) return;
    const raf = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(raf);
  }, [visible]);

  // Slide out first, then unmount — hence the two-step close.
  const dismiss = useCallback(() => {
    setShown(false);
    setTimeout(() => setDismissed(true), 220);
  }, []);

  const close = useCallback(() => {
    snooze();
    dismiss();
  }, [dismiss]);

  const onInstall = useCallback(async () => {
    const outcome = await install();
    // "dismissed" means they declined the browser's own dialog — respect that
    // for a while rather than re-offering on the next page view.
    if (outcome !== "accepted") snooze();
    dismiss();
  }, [install, dismiss]);

  if (!visible) return null;

  const isIOSFlow = platform === "ios";

  return (
    <div
      role="dialog"
      aria-label="Install English Connection"
      className="fixed inset-x-4 bottom-24 z-[90] mx-auto max-w-sm sm:inset-x-auto sm:bottom-6 sm:right-6"
      style={{
        transform: shown ? "translateY(0)" : "translateY(16px)",
        opacity: shown ? 1 : 0,
        transition: "transform 260ms cubic-bezier(0.32,0.72,0,1), opacity 220ms ease",
      }}
    >
      <div className="relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white p-4 shadow-[0_24px_60px_-18px_rgba(0,0,0,0.35)] dark:border-white/[0.1] dark:bg-[#14171c] dark:shadow-[0_24px_60px_-18px_rgba(0,0,0,0.75)]">
        <button
          type="button"
          onClick={close}
          aria-label="Dismiss"
          className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-black/5 hover:text-heading dark:hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3 pr-7">
          <Image
            src="/android-chrome-192x192.png"
            alt=""
            width={44}
            height={44}
            className="h-11 w-11 shrink-0 rounded-xl shadow-sm"
          />
          <div className="min-w-0">
            <p className="text-[15px] font-extrabold leading-tight text-heading">
              Install English Connection
            </p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              {isIOSFlow
                ? "Add it to your Home Screen — two taps, no App Store."
                : "Get the app — free, instant, no App Store."}
            </p>
          </div>
        </div>

        {isIOSFlow ? (
          <ol className="mt-3.5 space-y-2">
            <li className="flex items-center gap-2.5 rounded-xl bg-black/[0.03] px-3 py-2 text-[12.5px] text-body dark:bg-white/[0.04]">
              <Share className="h-4 w-4 shrink-0 text-heading" />
              <span>
                Tap <span className="font-bold text-heading">Share</span> in Safari&apos;s toolbar
              </span>
            </li>
            <li className="flex items-center gap-2.5 rounded-xl bg-black/[0.03] px-3 py-2 text-[12.5px] text-body dark:bg-white/[0.04]">
              <SquarePlus className="h-4 w-4 shrink-0 text-heading" />
              <span>
                Choose <span className="font-bold text-heading">Add to Home Screen</span>
              </span>
            </li>
          </ol>
        ) : (
          <ul className="mt-3.5 grid gap-1.5">
            {BENEFITS.map(({ Icon, text }) => (
              <li key={text} className="flex items-center gap-2 text-[12.5px] text-body">
                <Icon className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                {text}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex items-center gap-2">
          {isIOSFlow ? (
            <button
              type="button"
              onClick={close}
              className="flex-1 rounded-full bg-gradient-to-br from-primary-1 to-primary-2 px-4 py-2.5 text-[13px] font-bold text-primary-foreground transition hover:opacity-90 active:scale-[0.98]"
            >
              Got it
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onInstall}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-gradient-to-br from-primary-1 to-primary-2 px-4 py-2.5 text-[13px] font-bold text-primary-foreground transition hover:opacity-90 active:scale-[0.98]"
              >
                <Download className="h-4 w-4" /> Install app
              </button>
              <button
                type="button"
                onClick={close}
                className="rounded-full px-3.5 py-2.5 text-[13px] font-semibold text-muted-foreground transition hover:text-heading"
              >
                Not now
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
