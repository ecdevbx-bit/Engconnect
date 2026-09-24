import { BriefcaseBusiness, Building2, Coffee, GraduationCap, MessageCircle, Plane, Target, type LucideIcon } from "lucide-react";

import { AI_PARTNER_LANGUAGES, AI_PARTNER_LEVELS, AI_PARTNER_SCENARIOS, AI_PARTNER_VOICES } from "@/lib/aiPartnerOptions";
import { Wave, cssVars } from "./Wave";

// "Tune K.AI before every call" — four small figures, one per choice on the
// session start card. Counts and names come straight from aiPartnerOptions, so
// the landing can't drift from the app.

/* ── Levels: a staircase; each step's bubble talks at that level's pace ───── */

// Pace per level, drawn literally: fewer, softer, slower bars for Beginner
// (K.AI speaks softly and slowly — server/gemini/instructions/levels.ts),
// dense and quick for Expert.
const PACE = [
  { label: "Slow & soft", n: 7, gap: "7px", sp: "1500ms", wh: "18px" },
  { label: "Everyday pace", n: 11, gap: "4px", sp: "900ms", wh: "24px" },
  { label: "Natural speed", n: 16, gap: "2px", sp: "430ms", wh: "28px" },
] as const;

export function LevelLadder() {
  return (
    <div
      data-fig
      role="img"
      aria-label={`Three levels. ${AI_PARTNER_LEVELS.map((l, i) => `${l.label}: ${PACE[i].label.toLowerCase()}`).join(". ")}.`}
      className="grid w-full grid-cols-3 items-end gap-2 sm:gap-4"
    >
      {AI_PARTNER_LEVELS.map((l, i) => (
        <div key={l.id} className="flex min-w-0 flex-col items-center">
          <div className="relative grid h-14 w-full place-items-center rounded-2xl border border-border bg-surface-2/80">
            <Wave
              n={PACE[i].n}
              seed={i * 3 + 1}
              live
              className="text-primary"
              style={cssVars({ "--gap": PACE[i].gap, "--sp": PACE[i].sp, "--wh": PACE[i].wh })}
            />
            {/* bubble tail */}
            <span className="absolute -bottom-[7px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-border bg-surface-2" />
          </div>
          <span className="lp-tag mt-3 text-center text-body">{PACE[i].label}</span>
          <span
            className="lv-step mt-3 w-full rounded-t-2xl"
            style={{ ...cssVars({ "--i": i, "--a": `${22 + i * 26}%` }), height: `${56 + i * 56}px` }}
          />
          <span className="mt-3 truncate text-sm font-bold text-heading sm:text-base">{l.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Languages: script glyphs orbiting English, plus the mix bar ─────────── */

// One distinctive glyph per language (Bengali and Assamese share a script, so
// Assamese gets its own letter ৰ; Hindi/Marathi/Nepali all use Devanagari, so
// each shows the first letter of its own name).
const GLYPH: Record<string, string> = {
  Hindi: "हि",
  Bengali: "বা",
  Marathi: "म",
  Gujarati: "ગુ",
  Punjabi: "ਪੰ",
  Tamil: "த",
  Telugu: "తె",
  Kannada: "ಕ",
  Malayalam: "മ",
  Odia: "ଓ",
  Assamese: "ৰ",
  Urdu: "ار",
  Nepali: "ने",
};

const MIXED = AI_PARTNER_LANGUAGES.filter((l) => l.id !== "English");
const ORBIT_R = 104; // px — the orbit is a fixed 256px square

export function LanguageOrbit() {
  return (
    <div
      data-fig
      role="img"
      aria-label={`${AI_PARTNER_LANGUAGES.length} language options: English only, or mostly English mixed with a little ${MIXED.map((l) => l.id).join(", ")}.`}
      className="flex w-full flex-col items-center"
    >
      <div className="relative h-64 w-64">
        <span className="absolute inset-[24px] rounded-full border border-dashed border-heading/15" />
        <span className="absolute inset-[76px] rounded-full border border-heading/10" />
        <div className="lo-ring absolute inset-0">
          {MIXED.map((l, i) => {
            const a = (360 / MIXED.length) * i;
            return (
              <span
                key={l.id}
                className="absolute left-1/2 top-1/2 -ml-5 -mt-5 h-10 w-10"
                style={{ transform: `rotate(${a}deg) translateY(-${ORBIT_R}px) rotate(-${a}deg)` }}
              >
                <span
                  lang={l.id === "Urdu" ? "ur" : undefined}
                  className="lo-glyph grid h-10 w-10 place-items-center rounded-full border border-border bg-surface-1/90 text-base font-semibold text-heading"
                >
                  {GLYPH[l.id] ?? l.native}
                </span>
              </span>
            );
          })}
        </div>
        <span
          className="absolute left-1/2 top-1/2 grid h-24 w-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-primary-foreground shadow-lg"
          style={{ background: "var(--pro-pill)" }}
        >
          <span className="lp-kinetic text-3xl font-bold">Aa</span>
        </span>
      </div>

      {/* Mixed mode = mostly English, a little of yours (70/30, D-026). */}
      <div className="mt-6 w-full max-w-sm">
        <div className="flex h-9 overflow-hidden rounded-full border border-border text-xs font-bold">
          <span className="grid flex-[7] place-items-center text-primary-foreground" style={{ background: "var(--pro-pill)" }}>
            English
          </span>
          <span className="grid flex-[3] place-items-center bg-primary/15 text-heading">Yours</span>
        </div>
      </div>
    </div>
  );
}

/* ── Practice modes: icon grid, a highlight walks across it ──────────────── */

const MODE_ICON: Record<string, LucideIcon> = {
  "General Conversation": Coffee,
  "Job Interview": BriefcaseBusiness,
  "IELTS Speaking": GraduationCap,
  "Travel & Daily Life": Plane,
  "Office & Workplace": Building2,
  "Grammar Workout": Target,
};

// Scenario labels start with an emoji for the in-app picker; here icons do that job.
function plainLabel(label: string) {
  return label.replace(/^[^\p{L}\p{N}]+/u, "");
}

export function ModeGrid() {
  return (
    <ul data-fig aria-label="Practice modes" className="grid w-full grid-cols-2 gap-2 min-[480px]:grid-cols-3 sm:gap-3">
      {AI_PARTNER_SCENARIOS.map((s, i) => {
        const Icon = MODE_ICON[s.id] ?? MessageCircle;
        return (
          <li
            key={s.id}
            className="md-item relative flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface-2/60 px-2 py-3 text-center"
            style={cssVars({ "--i": i })}
          >
            <span className="md-hi pointer-events-none absolute inset-0 rounded-[inherit]" aria-hidden="true" />
            <span className="relative grid h-10 w-10 place-items-center rounded-full bg-primary/15 text-primary">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="relative text-xs font-semibold leading-tight text-heading sm:text-sm">{plainLabel(s.label)}</span>
          </li>
        );
      })}
    </ul>
  );
}

/* ── Voices: one equaliser bar per voice, grouped female / male ──────────── */

export function VoiceBars() {
  const female = AI_PARTNER_VOICES.filter((v) => v.tone === "female").length;
  const male = AI_PARTNER_VOICES.length - female;
  return (
    <div
      data-fig
      role="img"
      aria-label={`${AI_PARTNER_VOICES.length} voices for K.AI: ${female} female and ${male} male.`}
      className="grid w-full grid-cols-[minmax(0,var(--f))_minmax(0,var(--m))] gap-4"
      style={cssVars({ "--f": `${female}fr`, "--m": `${male}fr` })}
    >
      {[
        { label: `${female} female`, n: female, seed: 4, tone: "text-primary" },
        { label: `${male} male`, n: male, seed: 8, tone: "text-heading/60" },
      ].map((g) => (
        <div key={g.label} className="flex flex-col gap-3">
          <Wave
            n={g.n}
            seed={g.seed}
            live
            spread
            className={`vb-wave ${g.tone}`}
            style={cssVars({ "--wh": "88px", "--bw": "8px", "--sp": "1100ms" })}
          />
          <span className="lp-tag border-t border-border pt-2 text-body">{g.label}</span>
        </div>
      ))}
    </div>
  );
}
