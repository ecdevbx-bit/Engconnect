import Link from "next/link";
import type { Metadata } from "next";
import { Check, Infinity as InfinityIcon, MessageCircle, Sparkles } from "lucide-react";

import ProJoinButton from "./ProJoinButton";
import { formatProLinkEndsOn, type ProLinkStatus } from "@/lib/proInvite";
import { proInviteState } from "@/server/domain/premium";

// Read the link state in-process (no self-HTTP, D-018). Degrades to "not live"
// on any failure so a DB blip shows a plain page, not an error screen.
async function fetchProLinkStatus(): Promise<ProLinkStatus | null> {
  try {
    const s = await proInviteState();
    return {
      active: s.live,
      endsOn: s.displayEndsOn,
      ...(s.effectiveEndsOn ? {} : { durationDays: s.settings.durationDays }),
    };
  } catch {
    return null;
  }
}

// /pro — the fixed public Pro link.
//
// Deliberately its own entry point, separate from /login and /signup: this page
// makes the offer, and starting sign-in from here is what marks the signup as a
// Pro one. The URL never changes, so it can be printed, shared or pinned.
//
// The grant is decided entirely server-side (see the backend's applyProLink) and
// only ever on a NEW account — everything here is presentation.

export const metadata: Metadata = {
  title: "Get Pro free | English Connection",
  description: "Sign in through this invite and every Pro feature unlocks free — new and existing accounts alike.",
  // The link is meant to be shared directly, not found in search. Drop this
  // block if you ever want it indexed.
  robots: { index: false, follow: false },
};

// The offer depends on live settings, so this page can never be static.
export const dynamic = "force-dynamic";

const PERKS = [
  {
    icon: InfinityIcon,
    title: "Unlimited practice",
    body: "No daily caps on Jumble or Pronunciation — the free plan stops at 18 sentences and 3 pronunciation attempts a day.",
  },
  {
    icon: MessageCircle,
    title: "20 minutes with K.AI, every day",
    body: "Speak with your AI partner for 20 minutes every day. The free plan gets 20 minutes a week.",
  },
  {
    icon: Sparkles,
    title: "Everything else Pro unlocks",
    body: "Your streak, XP, badges and leaderboard place all carry on exactly as they are.",
  },
];

export default async function ProInvitePage() {
  const status = await fetchProLinkStatus();
  const live = status?.active ?? false;
  const endsOn = formatProLinkEndsOn(status?.endsOn ?? "");

  const promise = !live
    ? ""
    : endsOn
      ? `free until ${endsOn}`
      : status?.durationDays
        ? `free for ${status.durationDays} days`
        : "free";

  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:py-20">
      <div className="c-box rounded-2xl px-6 py-10 sm:px-10">
        {live ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-heading">
            ✨ Invite
          </span>
        ) : null}

        <h1 className="mt-4 text-3xl font-extrabold leading-tight text-heading sm:text-4xl">
          {live ? "Your Pro membership is on us" : "This invite has closed"}
        </h1>

        {live ? (
          <>
            <p className="mt-3 text-base text-muted-foreground">
              Sign in with Google — new here or not — and every Pro feature unlocks{" "}
              <strong className="text-heading">{promise}</strong>. No card, no trial to remember to
              cancel — it is simply on.
            </p>

            <ul className="mt-8 space-y-5">
              {PERKS.map((perk) => (
                <li key={perk.title} className="flex gap-4">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                    <perk.icon className="h-5 w-5 text-primary" />
                  </span>
                  <span>
                    <span className="block font-bold text-heading">{perk.title}</span>
                    <span className="block text-sm text-muted-foreground">{perk.body}</span>
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-9">
              <ProJoinButton label="Continue with Google and get Pro" />
              <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  Already have an account? Use this same button — signing in from this page is what
                  switches Pro on. If you are already on Pro, nothing changes and your current plan
                  is left exactly as it is.
                </span>
              </p>
            </div>
          </>
        ) : (
          <>
            <p className="mt-3 text-base text-muted-foreground">
              This Pro invite is no longer active. You can still create a free account and start
              practising right away — Jumble, Pronunciation and K.AI all have a free tier.
            </p>
            <div className="mt-8">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-base font-bold text-[#0b0e14] transition hover:bg-primary-1"
              >
                Create a free account
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
