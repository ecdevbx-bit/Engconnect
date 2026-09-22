"use client";

import { useState } from "react";

import { googleSignIn } from "@/lib/v3Auth";
import { emitToast } from "@/lib/toast";

// The CTA on the Pro page. Two steps, in this order:
//   1. POST /pro/start  — drops the cookie that marks this sign-in as coming
//                         from the Pro page (only a route handler can set it).
//   2. googleSignIn()   — the same proven Google flow the login card uses.
//
// Step 1 must land before the redirect, hence the await. If it fails we stop
// rather than sign the user in without the mark: a sign-in that silently misses
// the Pro grant is worse than a retry, because the backend stamps each account
// write-once and there is no second attempt for that account.
export default function ProJoinButton({ label = "Continue with Google and get Pro" }: { label?: string }) {
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    setLoading(true);
    try {
      const res = await fetch("/pro/start", { method: "POST" });
      if (!res.ok) throw new Error("could not start");
      await googleSignIn("/dashboard");
      // googleSignIn redirects to Google; control usually does not return here.
    } catch {
      emitToast({
        type: "error",
        title: "Could not start sign-in",
        body: "Please try again — your Pro access is still reserved.",
      });
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleJoin}
      disabled={loading}
      className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-primary px-6 py-3 text-base font-bold text-[#0b0e14] transition hover:bg-primary-1 disabled:opacity-60 sm:w-auto"
    >
      <GoogleMark />
      {loading ? "Redirecting…" : label}
    </button>
  );
}

// Google "G" mark. Inlined (no remote asset) so it renders under the strict CSP
// and never flashes a broken image — same approach as the login card.
const GoogleMark = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
    <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
    <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z" />
    <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z" />
  </svg>
);
