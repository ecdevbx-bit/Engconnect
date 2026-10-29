"use client";

import { cn } from "@/lib/utils";
import {
  AI_PARTNER_LEVELS,
  AI_PARTNER_SCENARIOS,
  AI_PARTNER_VOICES,
} from "@/lib/aiPartnerOptions";

// Pre-session setup for K.AI: level, practice mode and K.AI's voice. No
// language picker — K.AI matches the language the learner talks in (D-059).
// Choices are baked into the session's Gemini token, so changing them means
// starting a new session.

export type SessionSetupValue = { level: string; scenario: string; voice: string };

const LOCAL_KEY = "ai-partner:setup:v1";

export function defaultSetup(): SessionSetupValue {
  return {
    level: "Intermediate",
    scenario: "General Conversation",
    voice: "Aoede",
  };
}

// The learner's last choices on this device, or null if none / unreadable.
export function loadSavedSetup(): SessionSetupValue | null {
  try {
    if (typeof window === "undefined") return null;
    const saved = JSON.parse(window.localStorage.getItem(LOCAL_KEY) ?? "null") as Partial<SessionSetupValue> | null;
    if (!saved) return null;
    const d = defaultSetup();
    return {
      // "Advanced" was renamed "Expert".
      level: saved.level === "Advanced" ? "Expert" : AI_PARTNER_LEVELS.some((l) => l.id === saved.level) ? saved.level! : d.level,
      scenario: AI_PARTNER_SCENARIOS.some((s) => s.id === saved.scenario) ? saved.scenario! : d.scenario,
      voice: AI_PARTNER_VOICES.some((v) => v.id === saved.voice) ? saved.voice! : d.voice,
    };
  } catch {
    return null;
  }
}

export function saveSetup(v: SessionSetupValue) {
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(v));
  } catch {
    // storage unavailable (private mode) — the choice just isn't remembered
  }
}

export function setupSummary(v: SessionSetupValue): string {
  const mode = AI_PARTNER_SCENARIOS.find((s) => s.id === v.scenario)?.label ?? v.scenario;
  return `${mode} · ${v.level} · ${v.voice}`;
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">{children}</p>;
}

function Pill({ active, onClick, children, title }: { active: boolean; onClick: () => void; children: React.ReactNode; title?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={cn(
        "h-8 rounded-full px-3.5 text-[12px] font-semibold transition-colors",
        active
          ? "bg-gradient-to-br from-primary-1 to-primary-2 text-primary-foreground"
          : "bg-surface-3/60 text-muted-foreground hover:text-heading",
      )}
    >
      {children}
    </button>
  );
}

export default function SessionSetup({
  value,
  onChange,
}: {
  value: SessionSetupValue;
  onChange: (v: SessionSetupValue) => void;
}) {
  const set = (patch: Partial<SessionSetupValue>) => onChange({ ...value, ...patch });

  return (
    <div className="mt-4 space-y-4 rounded-xl border border-white/[0.06] bg-surface-2/40 px-4 py-4 text-left">
      <div className="space-y-2">
        <Label>Level</Label>
        <div className="flex flex-wrap gap-1.5">
          {AI_PARTNER_LEVELS.map((l) => (
            <Pill key={l.id} active={value.level === l.id} onClick={() => set({ level: l.id })} title={l.hint}>
              {l.label}
            </Pill>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{AI_PARTNER_LEVELS.find((l) => l.id === value.level)?.hint}</p>
      </div>

      <div className="space-y-2">
        <Label>Practice mode</Label>
        <div className="flex flex-wrap gap-1.5">
          {AI_PARTNER_SCENARIOS.map((s) => (
            <Pill key={s.id} active={value.scenario === s.id} onClick={() => set({ scenario: s.id })} title={s.hint}>
              {s.label}
            </Pill>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>K.AI&apos;s voice</Label>
        <div className="grid grid-cols-2 gap-2">
          {AI_PARTNER_VOICES.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => set({ voice: v.id })}
              aria-pressed={value.voice === v.id}
              className={cn(
                "min-h-11 rounded-lg border px-3 py-2 text-left transition-colors",
                value.voice === v.id
                  ? "border-primary/60 bg-primary/15 text-heading"
                  : "border-white/[0.06] bg-surface-3/40 text-muted-foreground hover:text-heading",
              )}
            >
              <span className="block text-[13px] font-bold">{v.tone === "female" ? "Female voice" : "Male voice"}</span>
              <span className="block text-[11px] opacity-80">
                {v.id} · {v.feel}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
