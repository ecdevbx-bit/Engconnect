"use client";

import { cn } from "@/lib/utils";

export default function TrainEngine({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)} style={{ width: 160, height: 120 }}>
      {/* steam puffs */}
      <span className="train-steam" style={{ left: 108, top: 0, animationDelay: "0s" }} />
      <span className="train-steam" style={{ left: 112, top: 0, animationDelay: "0.5s" }} />
      <span className="train-steam" style={{ left: 105, top: 0, animationDelay: "1.0s" }} />
      <span className="train-steam" style={{ left: 110, top: 0, animationDelay: "1.5s" }} />

      <svg viewBox="0 0 320 240" width="160" height="120" aria-hidden="true">
        <defs>
          <linearGradient id="te-boiler" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3C4759" />
            <stop offset="0.4" stopColor="#2B3645" />
            <stop offset="0.6" stopColor="#1F2630" />
            <stop offset="1" stopColor="#0F141A" />
          </linearGradient>
          <linearGradient id="te-brass" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#B38B39" />
            <stop offset="0.5" stopColor="#E5CB90" />
            <stop offset="1" stopColor="#B38B39" />
          </linearGradient>
          <linearGradient id="te-rim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7F8C9A" />
            <stop offset="1" stopColor="#4B5666" />
          </linearGradient>
          <linearGradient id="te-cabin" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#2B3645" />
            <stop offset="1" stopColor="#1F2630" />
          </linearGradient>
          <linearGradient id="te-glass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#A4DEE8" />
            <stop offset="1" stopColor="#5a8fc0" />
          </linearGradient>
        </defs>

        {/* headlight beam */}
        <polygon points="250,130 320,95 320,195 250,155" fill="#FFF2A8" opacity="0.08" />

        {/* rear coupler */}
        <rect x="2" y="145" width="18" height="10" rx="3" fill="#111" />

        {/* cabin */}
        <rect x="12" y="56" width="90" height="145" rx="6" fill="url(#te-cabin)" />
        {/* cabin roof */}
        <path d="M 4 56 Q 4 38 18 38 L 100 38 Q 114 38 114 56 Z" fill="#1E2329" />
        <rect x="6" y="53" width="108" height="5" fill="#3A414A" />
        {/* cabin window */}
        <rect x="32" y="80" width="52" height="44" rx="4" fill="#222" stroke="url(#te-rim)" strokeWidth="2" />
        <rect x="34" y="82" width="48" height="40" rx="3" fill="url(#te-glass)" />
        <rect x="34" y="82" width="48" height="18" rx="3" fill="#fff" opacity="0.35" />
        {/* cabin door */}
        <rect x="22" y="130" width="70" height="55" rx="2" fill="none" stroke="#1F2630" strokeWidth="2" />

        {/* boiler */}
        <rect x="92" y="95" width="170" height="95" rx="2" fill="url(#te-boiler)" />
        {/* boiler front face */}
        <circle cx="262" cy="142" r="48" fill="url(#te-boiler)" />
        <circle cx="262" cy="142" r="38" fill="#0C1014" />
        <circle cx="262" cy="142" r="35" fill="url(#te-rim)" />

        {/* brass accent stripes */}
        <rect x="92" y="125" width="170" height="7" fill="url(#te-brass)" />
        <rect x="92" y="155" width="170" height="4" fill="url(#te-brass)" />
        <rect x="92" y="95" width="170" height="3" fill="#fff" opacity="0.15" />

        {/* steam dome */}
        <path d="M155 95 Q165 72 175 95 Z" fill="#3C4759" stroke="#0F141A" />

        {/* smokestack */}
        <polygon points="218,95 215,50 245,50 242,95" fill="url(#te-boiler)" />
        <rect x="210" y="40" width="42" height="13" rx="3" fill="#0F1114" />
        <rect x="213" y="44" width="36" height="4" rx="1" fill="url(#te-brass)" />

        {/* brass whistle */}
        <rect x="185" y="68" width="9" height="27" rx="2" fill="url(#te-brass)" />
        <polygon points="180,65 198,65 194,73 184,73" fill="url(#te-brass)" />

        {/* headlight */}
        <path d="M 280,118 Q 298,118 298,135 L 298,150 Q 298,167 280,167 Z" fill="url(#te-boiler)" stroke="url(#te-rim)" strokeWidth="1" />
        <circle cx="294" cy="142" r="14" fill="#FFFBE6" opacity="0.12" />
        <circle cx="294" cy="142" r="9" fill="#FFFBE6" opacity="0.3" />
        <circle cx="294" cy="142" r="5" fill="#FFFFFF">
          <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
        </circle>

        {/* cowcatcher */}
        <polygon points="290,190 318,190 306,218 272,218" fill="url(#te-boiler)" />
        <polygon points="294,194 310,194 302,214 278,214" fill="#2B2B2B" />
        <line x1="298" y1="194" x2="286" y2="214" stroke="#1A1A1A" strokeWidth="2" />
        <line x1="306" y1="194" x2="294" y2="214" stroke="#1A1A1A" strokeWidth="2" />

        {/* footplate / chassis */}
        <rect x="10" y="190" width="300" height="14" rx="5" fill="#181818" />

        {/* piston box */}
        <rect x="228" y="170" width="50" height="30" rx="4" fill="url(#te-boiler)" stroke="url(#te-rim)" strokeWidth="1" />
        <rect x="233" y="175" width="40" height="20" rx="2" fill="#444" />

        {/* connecting rod */}
        <rect x="80" y="210" width="160" height="7" rx="3" fill="url(#te-rim)" />
        <circle cx="80" cy="213" r="5" fill="#333" />
        <circle cx="160" cy="213" r="5" fill="#333" />
        <circle cx="240" cy="213" r="5" fill="#333" />

        {/* ── Wheels ── */}
        {/* big driver 1 */}
        <g>
          <circle cx="88" cy="218" r="22" fill="#0A0A0A" />
          <circle cx="88" cy="218" r="19" fill="url(#te-rim)" />
          <circle cx="88" cy="218" r="17" fill="#4A4A4A" />
          <circle cx="88" cy="218" r="13" fill="#181818" />
          <g className="engine-wheel-spin" style={{ transformOrigin: "88px 218px" }}>
            <path d="M 88 201 L 88 235 M 71 218 L 105 218 M 75 205 L 101 231 M 75 231 L 101 205" stroke="#777" strokeWidth="2.5" />
          </g>
          <circle cx="88" cy="218" r="5" fill="#999" />
        </g>
        {/* big driver 2 */}
        <g>
          <circle cx="168" cy="218" r="22" fill="#0A0A0A" />
          <circle cx="168" cy="218" r="19" fill="url(#te-rim)" />
          <circle cx="168" cy="218" r="17" fill="#4A4A4A" />
          <circle cx="168" cy="218" r="13" fill="#181818" />
          <g className="engine-wheel-spin" style={{ transformOrigin: "168px 218px" }}>
            <path d="M 168 201 L 168 235 M 151 218 L 185 218 M 155 205 L 181 231 M 155 231 L 181 205" stroke="#777" strokeWidth="2.5" />
          </g>
          <circle cx="168" cy="218" r="5" fill="#999" />
        </g>
        {/* small front wheel */}
        <g>
          <circle cx="254" cy="218" r="14" fill="#0A0A0A" />
          <circle cx="254" cy="218" r="10" fill="#4A4A4A" />
          <g className="engine-wheel-spin" style={{ transformOrigin: "254px 218px" }}>
            <path d="M 254 208 L 254 228 M 244 218 L 264 218 M 247 211 L 261 225 M 247 225 L 261 211" stroke="#1A1A1A" strokeWidth="2" />
          </g>
          <circle cx="254" cy="218" r="4" fill="#7A7A7A" />
        </g>
      </svg>
    </div>
  );
}
