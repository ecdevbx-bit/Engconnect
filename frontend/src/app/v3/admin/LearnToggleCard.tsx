"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { saveFeatureFlagsAction } from "./feature-flags/actions";

const FLAG = "englishconnection-learn";

// Admin home: the Learn library's "show to everyone" switch, right where the
// owner looks first (same flag as on the Feature flags page).
export default function LearnToggleCard({ initialOn }: { initialOn: boolean }) {
  const [on, setOn] = useState(initialOn);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    const next = !on;
    setOn(next);
    startTransition(async () => {
      const res = await saveFeatureFlagsAction({ [FLAG]: next });
      const saved = res.data?.flags.find((f) => f.key === FLAG)?.enabled;
      if (typeof saved === "boolean") setOn(saved);
      setMsg(res.ok ? (next ? "Visible to everyone" : "Hidden — admins only") : (res.message ?? "Couldn't save"));
    });
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-primary/[0.06] p-5 sm:col-span-2">
      <div className="min-w-0">
        <p className="font-bold text-heading">
          Learn library{" "}
          <Link href="/learn" className="text-sm font-semibold text-primary hover:underline">
            open /learn →
          </Link>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {on
            ? "ON — everyone can open the free lessons (Pro lessons stay locked); it's in the menus and the sitemap."
            : "OFF — only admins can see it. Read the lessons, then switch it on."}
        </p>
        {msg && <p className="mt-1 text-xs font-semibold text-primary">{msg}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Show the Learn library to everyone"
        disabled={pending}
        onClick={toggle}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
          on ? "bg-primary" : "bg-white/15"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
            on ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
