import type { TrackId } from "@/content/learn/types";

// Small decorative figure per track (inline SVG, no images). Accent colour is
// a mid-tone used for shapes only; lines use currentColor so they follow the
// theme's text colour.
export function TrackArt({ id, accent, className }: { id: TrackId; accent: string; className?: string }) {
  // Soft fills use fill-opacity (not color-mix) so every browser draws them.
  const soft = { fill: accent, fillOpacity: 0.22 };
  return (
    <svg viewBox="0 0 120 72" className={className} aria-hidden focusable="false">
      {id === "beginner" && (
        // three sentence blocks: S + V + O
        <g>
          <rect x="4" y="24" width="32" height="24" rx="6" fill="#0ea5e9" fillOpacity=".25" stroke="#0ea5e9" strokeWidth="1.5" />
          <rect x="44" y="24" width="30" height="24" rx="6" fill="#f97316" fillOpacity=".25" stroke="#f97316" strokeWidth="1.5" />
          <rect x="82" y="24" width="34" height="24" rx="6" {...soft} stroke={accent} strokeWidth="1.5" />
          <text x="20" y="40" textAnchor="middle" fontSize="11" fontWeight="800" fill="currentColor">S</text>
          <text x="59" y="40" textAnchor="middle" fontSize="11" fontWeight="800" fill="currentColor">V</text>
          <text x="99" y="40" textAnchor="middle" fontSize="11" fontWeight="800" fill="currentColor">O</text>
          <path d="M38 36h4M76 36h4" stroke="currentColor" strokeOpacity=".5" strokeWidth="1.5" />
        </g>
      )}
      {id === "intermediate" && (
        // a tense timeline: span up to now
        <g>
          <path d="M6 44h100" stroke="currentColor" strokeOpacity=".45" strokeWidth="2" strokeLinecap="round" />
          <path d="M104 39l8 5-8 5z" fill="currentColor" fillOpacity=".45" />
          <rect x="22" y="40" width="52" height="8" rx="4" fill={accent} />
          <circle cx="22" cy="44" r="6" {...soft} stroke={accent} strokeWidth="1.5" />
          <path d="M74 16v44" stroke="currentColor" strokeOpacity=".6" strokeWidth="1.5" strokeDasharray="3 3" />
          <rect x="60" y="8" width="28" height="12" rx="6" fill="currentColor" fillOpacity=".85" />
        </g>
      )}
      {id === "advanced" && (
        // "if" branching into what happened and what could have happened
        <g>
          <circle cx="16" cy="36" r="7" {...soft} stroke={accent} strokeWidth="1.5" />
          <path d="M23 36 C48 36 52 16 80 16" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M23 36 C48 36 52 56 80 56" fill="none" stroke="currentColor" strokeOpacity=".5" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" />
          <rect x="82" y="8" width="32" height="16" rx="8" {...soft} stroke={accent} strokeWidth="1.5" />
          <rect x="82" y="48" width="32" height="16" rx="8" fill="none" stroke="currentColor" strokeOpacity=".45" strokeWidth="1.5" strokeDasharray="3 3" />
        </g>
      )}
      {id === "career" && (
        // two speech bubbles — a conversation
        <g>
          <path d="M16 12h46a8 8 0 0 1 8 8v16a8 8 0 0 1-8 8H30l-10 9v-9h-4a8 8 0 0 1-8-8V20a8 8 0 0 1 8-8z" {...soft} stroke={accent} strokeWidth="1.5" />
          <path d="M58 30h46a8 8 0 0 1 8 8v14a8 8 0 0 1-8 8h-2v8l-9-8H58a8 8 0 0 1-8-8V38a8 8 0 0 1 8-8z" fill="currentColor" fillOpacity=".08" stroke="currentColor" strokeOpacity=".5" strokeWidth="1.5" />
          <path d="M20 24h36M20 32h24" stroke="currentColor" strokeOpacity=".55" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M62 42h36M62 50h22" stroke="currentColor" strokeOpacity=".35" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}
