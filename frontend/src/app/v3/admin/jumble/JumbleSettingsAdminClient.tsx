"use client";

import { useState, useTransition } from "react";
import { RotateCcw, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { saveJumbleSettingsAction, type AdminJumbleSettings } from "./actions";
import AdminTabs, { type AdminMode } from "../AdminTabs";
import JsonDocEditor from "../JsonDocEditor";

// JumbleSettingsAdminClient — single-form editor for the jumble game's
// tunable values. Today that's one field: the bonus XP granted when a
// player completes a full progressive set (easy → medium → hard). Form
// state is a raw string so a mid-edit value doesn't get clobbered.

const BONUS_MIN = 0;
const BONUS_MAX = 1000;

export default function JumbleSettingsAdminClient({
  initial,
  defaults,
}: {
  initial: AdminJumbleSettings;
  defaults: AdminJumbleSettings;
}) {
  const [bonus, setBonus] = useState(String(initial.progressiveSetBonusXp));
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);
  const [mode, setMode] = useState<AdminMode>("ui");

  // Current value as the stored shape, for the JSON view. Falls back to the
  // last-loaded value while mid-edit / unparseable.
  const parsed = parseInt(bonus, 10);
  const current: AdminJumbleSettings = {
    progressiveSetBonusXp: Number.isFinite(parsed) ? parsed : initial.progressiveSetBonusXp,
  };

  function resetToDefaults() {
    setBonus(String(defaults.progressiveSetBonusXp));
    setStatus("Reset to defaults — click Save to apply.");
  }

  function save() {
    setStatus(null);
    const n = parseInt(bonus, 10);
    if (!Number.isFinite(n) || n < BONUS_MIN || n > BONUS_MAX) {
      setStatus(`Bonus XP must be a whole number between ${BONUS_MIN} and ${BONUS_MAX}.`);
      return;
    }
    startTransition(async () => {
      const res = await saveJumbleSettingsAction({ progressiveSetBonusXp: n });
      if (!res.ok) {
        setStatus(res.message ?? "Save failed");
        return;
      }
      if (res.data) {
        setBonus(String(res.data.current.progressiveSetBonusXp));
      }
      setStatus("Saved. The new bonus applies to the next completed set.");
    });
  }

  if (mode === "json") {
    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <AdminTabs mode={mode} onChange={setMode} />
        </div>
        <JsonDocEditor<AdminJumbleSettings>
          initial={current}
          hint="Jumble settings (the stored wire shape). Saved as a whole-object replace."
          apply={async (parsedDoc) => {
            const res = await saveJumbleSettingsAction(parsedDoc);
            if (res.ok && res.data) setBonus(String(res.data.current.progressiveSetBonusXp));
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
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Progressive set bonus XP
            </Label>
            <Input
              type="number"
              inputMode="numeric"
              step="1"
              min={BONUS_MIN}
              max={BONUS_MAX}
              value={bonus}
              onChange={(e) => {
                setBonus(e.target.value);
                setStatus(null);
              }}
            />
            <p className="text-xs text-muted-foreground">
              Extra XP granted when a player clears every stage of a
              progressive set (easy → medium → hard), on top of the per-question
              XP. {BONUS_MIN} – {BONUS_MAX}.
            </p>
          </div>
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
