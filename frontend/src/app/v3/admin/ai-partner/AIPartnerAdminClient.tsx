"use client";

import { useState, useTransition } from "react";
import { RotateCcw, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  saveAIPartnerRewardsAction,
  type AdminAIPartnerRewards,
} from "./actions";
import AdminTabs, { type AdminMode } from "../AdminTabs";
import JsonDocEditor from "../JsonDocEditor";

// AIPartnerAdminClient — single-form editor for the six AI Partner
// reward fields. The backend cache refreshes inline on save, so a value
// change is live on the next WS turn — no restart required.
//
// Two helper actions:
//   - "Reset to defaults" pre-fills the form (caller still has to Save)
//   - Inline preview math so the admin sees what the rule does

const FIELDS: Array<{
  key: keyof AdminAIPartnerRewards;
  label: string;
  hint: string;
  min: number;
  max: number;
}> = [
  {
    key: "thresholdSeconds",
    label: "Threshold (seconds)",
    hint: "Minimum cumulative speech time before any XP is awarded.",
    min: 1,
    max: 600,
  },
  {
    key: "thresholdXp",
    label: "Threshold XP",
    hint: "XP awarded the first time a user crosses the threshold in a session.",
    min: 0,
    max: 1000,
  },
  {
    key: "recurringIntervalSeconds",
    label: "Recurring interval (seconds)",
    hint: "Seconds of additional speech between each subsequent reward.",
    min: 1,
    max: 600,
  },
  {
    key: "recurringXp",
    label: "Recurring XP",
    hint: "XP awarded for every recurring milestone after the threshold.",
    min: 0,
    max: 1000,
  },
  {
    key: "maxRecordingSeconds",
    label: "Max recording (seconds)",
    hint: "How long the mic stays open before auto-stop. 1 – 120.",
    min: 1,
    max: 120,
  },
  {
    key: "sessionSeconds",
    label: "Session length (seconds)",
    hint: "Total session duration before the countdown ends. 60 – 3600.",
    min: 60,
    max: 3600,
  },
  {
    key: "proDailyCapSeconds",
    label: "Pro daily cap (seconds)",
    hint: "Total AI-Partner time a Pro user gets per day (IST reset). 0 = no cap. Default 1200 (20 min).",
    min: 0,
    max: 86400,
  },
  {
    key: "freeWeeklyCapSeconds",
    label: "Free weekly cap (seconds)",
    hint: "Total AI-Partner time a free user gets per week (Mon reset). 0 = no cap. Default 1200 (20 min).",
    min: 0,
    max: 604800,
  },
];

export default function AIPartnerAdminClient({
  initial,
  defaults,
}: {
  initial: AdminAIPartnerRewards;
  defaults: AdminAIPartnerRewards;
}) {
  const [values, setValues] = useState<AdminAIPartnerRewards>(initial);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);
  const [mode, setMode] = useState<AdminMode>("ui");

  function update<K extends keyof AdminAIPartnerRewards>(key: K, raw: string) {
    const n = parseInt(raw, 10);
    setValues((prev) => ({ ...prev, [key]: Number.isFinite(n) ? n : 0 }));
    setStatus(null);
  }

  function resetToDefaults() {
    setValues(defaults);
    setStatus("Reset to defaults — click Save to apply.");
  }

  function save() {
    setStatus(null);
    startTransition(async () => {
      const res = await saveAIPartnerRewardsAction(values);
      if (!res.ok) {
        setStatus(res.message ?? "Save failed");
        return;
      }
      if (res.data) {
        setValues(res.data.current);
      }
      setStatus("Saved. New values are live on the next chat turn.");
    });
  }

  // Quick preview of how much XP the rule pays at the example points
  // 0:15, 0:25, 0:45, 1:30 — so the admin can sanity-check the rule
  // without leaving the page.
  const preview = previewRow(values);

  if (mode === "json") {
    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <AdminTabs mode={mode} onChange={setMode} />
        </div>
        <JsonDocEditor<AdminAIPartnerRewards>
          initial={values}
          hint="AI-partner reward config (all values in seconds / XP). Saved as a whole-object replace."
          apply={async (parsed) => {
            const res = await saveAIPartnerRewardsAction(parsed);
            if (res.ok && res.data) setValues(res.data.current);
            return { ok: res.ok, message: res.message };
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <AdminTabs mode={mode} onChange={setMode} />
      </div>
      <div className="c-box rounded-xl p-5">
        <div className="grid gap-5 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <div key={f.key} className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {f.label}
              </Label>
              <Input
                type="number"
                inputMode="numeric"
                min={f.min}
                max={f.max}
                value={values[f.key]}
                onChange={(e) => update(f.key, e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{f.hint}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="c-box rounded-xl p-5">
        <p className="text-sm font-semibold text-heading">Preview</p>
        <p className="mt-1 text-xs text-muted-foreground">
          XP a user would have earned after speaking the listed cumulative
          duration in a single session.
        </p>
        <table className="mt-3 w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="pb-2">Time spoken</th>
              <th className="pb-2">Milestones</th>
              <th className="pb-2">Total XP</th>
            </tr>
          </thead>
          <tbody>
            {preview.map((r) => (
              <tr key={r.seconds} className="border-t border-white/[0.04]">
                <td className="py-2 font-mono text-heading">{formatTime(r.seconds)}</td>
                <td className="py-2 text-heading">{r.milestones}</td>
                <td className="py-2 font-semibold text-primary">+{r.xp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={save} disabled={pending}>
          <Save className="h-4 w-4" />
          {pending ? "Saving…" : "Save changes"}
        </Button>
        <Button onClick={resetToDefaults} variant="secondary" disabled={pending}>
          <RotateCcw className="h-4 w-4" />
          Reset to defaults
        </Button>
        {status && <span className="text-sm text-muted-foreground">{status}</span>}
      </div>
    </div>
  );
}

function previewRow(cfg: AdminAIPartnerRewards) {
  const samples = [
    cfg.thresholdSeconds - 1,
    cfg.thresholdSeconds,
    cfg.thresholdSeconds + cfg.recurringIntervalSeconds,
    cfg.thresholdSeconds + cfg.recurringIntervalSeconds * 3,
    cfg.thresholdSeconds + cfg.recurringIntervalSeconds * 6,
  ];
  return samples
    .filter((s) => s >= 0)
    .map((seconds) => {
      const milestones =
        seconds < cfg.thresholdSeconds
          ? 0
          : 1 +
            Math.floor((seconds - cfg.thresholdSeconds) / Math.max(1, cfg.recurringIntervalSeconds));
      const xp =
        milestones === 0
          ? 0
          : cfg.thresholdXp + Math.max(0, milestones - 1) * cfg.recurringXp;
      return { seconds, milestones, xp };
    });
}

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m === 0) return `${r}s`;
  return `${m}m ${String(r).padStart(2, "0")}s`;
}
