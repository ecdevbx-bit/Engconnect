"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { saveFeatureFlagsAction, type FeatureFlag, type FeatureFlagsResponse } from "./actions";

type ActionResult = { ok: boolean; message?: string; data?: FeatureFlagsResponse };

export default function FeatureFlagsAdminClient({ initial }: { initial: FeatureFlagsResponse }) {
  const [flags, setFlags] = useState<FeatureFlag[]>(initial.flags);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const toggle = (key: string, enabled: boolean) => {
    // Optimistic flip; the server response re-seeds authoritative state.
    const next = flags.map((f) => (f.key === key ? { ...f, enabled } : f));
    setFlags(next);
    const map = Object.fromEntries(next.map((f) => [f.key, f.enabled]));
    startTransition(async () => {
      const res: ActionResult = await saveFeatureFlagsAction(map);
      if (res.data) setFlags(res.data.flags);
      setMsg(res.message ?? (res.ok ? "Saved" : "Something went wrong"));
    });
  };

  if (flags.length === 0) {
    return <p className="text-sm text-muted-foreground">No flags are registered yet.</p>;
  }

  return (
    <div className="space-y-4">
      {msg && <p className="text-sm font-medium text-primary">{msg}</p>}

      <ul className="space-y-3">
        {flags.map((f) => (
          <li
            key={f.key}
            className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-surface-2/40 p-4"
          >
            <div className="min-w-0">
              <p className="font-bold text-heading">{f.description || f.key}</p>
              <p className="truncate font-mono text-xs text-muted-foreground">{f.key}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={f.enabled}
              aria-label={`Toggle ${f.description || f.key}`}
              disabled={pending}
              onClick={() => toggle(f.key, !f.enabled)}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                f.enabled ? "bg-primary" : "bg-white/15"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  f.enabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </li>
        ))}
      </ul>

      {pending && (
        <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Saving…
        </p>
      )}
    </div>
  );
}
