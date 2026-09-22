"use client";

import { useState, useTransition } from "react";
import { RotateCcw, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  savePronunciationTimingsAction,
  type AdminPronunciationTimings,
} from "./actions";
import AdminTabs, { type AdminMode } from "../AdminTabs";
import JsonDocEditor from "../JsonDocEditor";

// PronunciationTimingsAdminClient — single-form editor for the four
// pronunciation timing fields. The backend stores milliseconds; the admin
// edits seconds (one decimal). We keep the form state as raw strings so a
// half-typed "4." doesn't get clobbered, and convert sec ⇄ ms at the edges.

type TimingKey = keyof AdminPronunciationTimings;

const FIELDS: Array<{
  key: TimingKey;
  label: string;
  hint: string;
  min: number; // seconds
  max: number; // seconds
}> = [
  {
    key: "countdownMs",
    label: "Countdown wait (seconds)",
    hint: "Pause before recording auto-starts. Shared by every difficulty. 1 – 30s.",
    min: 1,
    max: 30,
  },
  {
    key: "easyRecordDurationMs",
    label: "Easy — recording length (seconds)",
    hint: "How long the mic stays open on Easy before auto-stop. Decimals allowed, e.g. 4.5. 1 – 60s.",
    min: 1,
    max: 60,
  },
  {
    key: "mediumRecordDurationMs",
    label: "Medium — recording length (seconds)",
    hint: "How long the mic stays open on Medium before auto-stop. Decimals allowed. 1 – 60s.",
    min: 1,
    max: 60,
  },
  {
    key: "hardRecordDurationMs",
    label: "Hard — recording length (seconds)",
    hint: "How long the mic stays open on Hard before auto-stop. Decimals allowed. 1 – 60s.",
    min: 1,
    max: 60,
  },
];

// ms ⇄ seconds, rounded to one decimal so 4500 → "4.5", 6000 → "6".
function msToSec(ms: number): string {
  return String(Math.round(ms / 100) / 10);
}

// Parse a seconds string back to ms, falling back when it's mid-edit/invalid.
function secToMs(raw: string, fallback: number): number {
  const n = parseFloat(raw);
  return Number.isFinite(n) ? Math.round(n * 1000) : fallback;
}

type SecStrings = Record<TimingKey, string>;

function toSecStrings(ms: AdminPronunciationTimings): SecStrings {
  return {
    countdownMs: msToSec(ms.countdownMs),
    easyRecordDurationMs: msToSec(ms.easyRecordDurationMs),
    mediumRecordDurationMs: msToSec(ms.mediumRecordDurationMs),
    hardRecordDurationMs: msToSec(ms.hardRecordDurationMs),
  };
}

export default function PronunciationTimingsAdminClient({
  initial,
  defaults,
}: {
  initial: AdminPronunciationTimings;
  defaults: AdminPronunciationTimings;
}) {
  const [secs, setSecs] = useState<SecStrings>(toSecStrings(initial));
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);
  const [mode, setMode] = useState<AdminMode>("ui");

  // Current values as the stored ms shape, for the JSON view. Falls back to
  // the last-loaded value for any field that's mid-edit / unparseable.
  const currentMs: AdminPronunciationTimings = {
    countdownMs: secToMs(secs.countdownMs, initial.countdownMs),
    easyRecordDurationMs: secToMs(secs.easyRecordDurationMs, initial.easyRecordDurationMs),
    mediumRecordDurationMs: secToMs(secs.mediumRecordDurationMs, initial.mediumRecordDurationMs),
    hardRecordDurationMs: secToMs(secs.hardRecordDurationMs, initial.hardRecordDurationMs),
  };

  function update(key: TimingKey, raw: string) {
    setSecs((prev) => ({ ...prev, [key]: raw }));
    setStatus(null);
  }

  function resetToDefaults() {
    setSecs(toSecStrings(defaults));
    setStatus("Reset to defaults — click Save to apply.");
  }

  function save() {
    setStatus(null);
    // Parse + validate every field in seconds, then convert to ms.
    const payload = {} as AdminPronunciationTimings;
    for (const f of FIELDS) {
      const n = parseFloat(secs[f.key]);
      if (!Number.isFinite(n) || n < f.min || n > f.max) {
        setStatus(`${f.label} must be a number between ${f.min} and ${f.max}.`);
        return;
      }
      payload[f.key] = Math.round(n * 1000);
    }
    startTransition(async () => {
      const res = await savePronunciationTimingsAction(payload);
      if (!res.ok) {
        setStatus(res.message ?? "Save failed");
        return;
      }
      if (res.data) {
        setSecs(toSecStrings(res.data.current));
      }
      setStatus("Saved. New timings are live on the next sentence.");
    });
  }

  if (mode === "json") {
    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <AdminTabs mode={mode} onChange={setMode} />
        </div>
        <JsonDocEditor<AdminPronunciationTimings>
          initial={currentMs}
          hint="Pronunciation timings in MILLISECONDS (the stored wire shape; the form edits seconds). Saved as a whole-object replace."
          apply={async (parsed) => {
            const res = await savePronunciationTimingsAction(parsed);
            if (res.ok && res.data) setSecs(toSecStrings(res.data.current));
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
                inputMode="decimal"
                step="0.1"
                min={f.min}
                max={f.max}
                value={secs[f.key]}
                onChange={(e) => update(f.key, e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{f.hint}</p>
            </div>
          ))}
        </div>
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
