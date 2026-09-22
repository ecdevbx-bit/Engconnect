"use client";

import { cn } from "@/lib/utils";
import {
  AI_PARTNER_LANGUAGES,
  AI_PARTNER_LEVELS,
  AI_PARTNER_SCENARIOS,
  AI_PARTNER_VOICES,
} from "@/lib/aiPartnerOptions";

// Pre-session setup for K.AI (like ENGAI's controls): which language to mix
// with English, level, practice mode and K.AI's voice. Choices are baked into
// the session's Gemini token, so changing them means starting a new session.

export type SessionSetupValue = { language: string; level: string; scenario: string; voice: string };

const LOCAL_KEY = "ai-partner:setup:v1";

// Defaults: mix in the learner's own language (from their profile) if we
// support it, else English only.
export function defaultSetup(profileLang: string): SessionSetupValue {
  return {
    language: AI_PARTNER_LANGUAGES.some((l) => l.id === profileLang) ? profileLang : "English",
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
    const d = defaultSetup("English");
    return {
      language: AI_PARTNER_LANGUAGES.some((l) => l.id === saved.language) ? saved.language! : d.language,
      level: AI_PARTNER_LEVELS.some((l) => l.id === saved.level) ? saved.level! : d.level,
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
  const lang = AI_PARTNER_LANGUAGES.find((l) => l.id === v.language)?.label ?? v.language;
  const mode = AI_PARTNER_SCENARIOS.find((s) => s.id === v.scenario)?.label ?? v.scenario;
  return `${lang} · ${mode} · ${v.level} · Voice ${v.voice}`;
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
  profileLang,
}: {
  value: SessionSetupValue;
  onChange: (v: SessionSetupValue) => void;
  profileLang: string;
}) {
  const set = (patch: Partial<SessionSetupValue>) => onChange({ ...value, ...patch });
  // The learner's own language first, then English, then the rest.
  const languages = [...AI_PARTNER_LANGUAGES].sort((a, b) => {
    const rank = (id: string) => (id === profileLang ? 0 : id === "English" ? 1 : 2);
    return rank(a.id) - rank(b.id);
  });

  return (
    <div className="mt-4 space-y-4 rounded-xl border border-white/[0.06] bg-surface-2/40 px-4 py-4 text-left">
      <div className="space-y-2">
        <Label>Language</Label>
        <p className="text-[12px] leading-5 text-muted-foreground">
          K.AI teaches in English and can mix in your language (70/30, written in English letters) to explain things.
        </p>
        <select
          value={value.language}
          onChange={(e) => set({ language: e.target.value })}
          className="h-9 w-full rounded-lg border border-white/10 bg-surface-1 px-3 text-[13px] font-semibold text-heading sm:w-72"
          aria-label="Session language"
        >
          {languages.map((l) => (
            <option key={l.id} value={l.id}>
              {l.native} · {l.label}
              {l.id === profileLang && l.id !== "English" ? " (your language)" : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label>Level</Label>
        <div className="flex flex-wrap gap-1.5">
          {AI_PARTNER_LEVELS.map((l) => (
            <Pill key={l.id} active={value.level === l.id} onClick={() => set({ level: l.id })} title={l.hint}>
              {l.label}
            </Pill>
          ))}
        </div>
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
        <p className="text-[11px] text-muted-foreground">
          {AI_PARTNER_SCENARIOS.find((s) => s.id === value.scenario)?.hint}
        </p>
      </div>

      <div className="space-y-2">
        <Label>K.AI&apos;s voice</Label>
        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
          {AI_PARTNER_VOICES.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => set({ voice: v.id })}
              aria-pressed={value.voice === v.id}
              className={cn(
                "rounded-lg border px-2 py-1.5 text-left transition-colors",
                value.voice === v.id
                  ? "border-primary/60 bg-primary/15 text-heading"
                  : "border-white/[0.06] bg-surface-3/40 text-muted-foreground hover:text-heading",
              )}
            >
              <span className="block text-[12px] font-bold">{v.id}</span>
              <span className="block text-[10px] opacity-80">
                {v.feel} · {v.tone === "female" ? "♀" : "♂"}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
