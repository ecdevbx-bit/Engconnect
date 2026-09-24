// CSS for the landing's explanatory figures (landing/figures/*), appended to
// LANDING_CSS by ShowcaseV4. Rules this file follows:
// - Every figure is server-rendered HTML/SVG; its un-animated styles ARE the
//   finished picture (what reduced-motion visitors, no-JS and screenshots get).
// - Motion only runs inside `[data-play]` (set by landing/FigurePlayer while the
//   figure is on screen) and only for `prefers-reduced-motion: no-preference`.
// - Animations stick to transform / opacity, plus a few tiny paint-only ones
//   (clip-path on the call timeline, a text-decoration colour, an SVG dash).
// - Colours are theme tokens; the three status colours flip with the theme.

const JUMBLE_CHIPS = 6;
const PRON_WORDS = 5;

// Jumble: chip k lifts out of the yard during [s, e]% of the 9 s loop, all hold
// in the rail until 92%, then all drop back together.
const jumbleKeyframes = Array.from({ length: JUMBLE_CHIPS }, (_, k) => {
  const s = 12 + 7 * k;
  const e = s + 5;
  const yard = "translate(var(--x0), var(--y0)) rotate(var(--r0)) scale(1)";
  const rail = "translate(var(--x1), var(--y1)) rotate(0deg) scale(1)";
  const lift =
    "translate(calc((var(--x0) + var(--x1)) / 2), calc((var(--y0) + var(--y1)) / 2 - 0.9em)) rotate(0deg) scale(1.08)";
  return `@keyframes jb-c${k} { 0%, ${s}% { transform: ${yard}; } ${s + 2.5}% { transform: ${lift}; } ${e}%, 92% { transform: ${rail}; } 98%, 100% { transform: ${yard}; } }
  .lp [data-play] .jb-c${k} { animation: jb-c${k} 9s var(--lp-ease) infinite; }`;
}).join("\n");

// Pronunciation: word k gets its colour at t% of the 11 s loop.
const pronKeyframes = Array.from({ length: PRON_WORDS }, (_, k) => {
  const t = 30 + 4 * k;
  return `@keyframes pr-t${k} { 0%, ${t}% { opacity: 0; } ${t + 3}%, 95% { opacity: 1; } 100% { opacity: 0; } }
  .lp [data-play] .pr-t${k} { animation: pr-t${k} 11s ease infinite; }`;
}).join("\n");

export const FIGURE_CSS = `
.lp { --lp-ok: #34d399; --lp-warn: #fbbf24; --lp-bad: #fb7185; }
.light .lp { --lp-ok: #047857; --lp-warn: #b45309; --lp-bad: #be123c; }

/* Tiny diagram labels (colour comes from a text-* utility in the markup). */
.lp-tag { font-family: var(--ff-mono), "Fira Code", ui-monospace, monospace; font-size: 10.5px; font-weight: 600; line-height: 1.25; letter-spacing: 0.14em; text-transform: uppercase; }

/* Speech waves (landing/figures/Wave). */
.lp-wave { display: inline-flex; align-items: center; gap: var(--gap, 3px); height: var(--wh, 28px); }
.lp-wave-spread { display: flex; width: 100%; justify-content: space-between; gap: 1px; }
.lp-wave > i { display: block; flex: none; width: var(--bw, 3px); height: calc(var(--h) * 100%); border-radius: 9999px; background: currentColor; transform-origin: 50% 50%; }

.lp-live-dot { position: relative; flex: none; width: 8px; height: 8px; border-radius: 9999px; background: var(--lp-ok); }
.lp-live-dot::after { content: ""; position: absolute; inset: 0; border-radius: inherit; background: var(--lp-ok); opacity: 0; }

/* A slip and its fix. */
.lp-struck { text-decoration: line-through; text-decoration-thickness: 2px; text-decoration-color: var(--lp-bad); }
.lp-marked, .hc-fix { font-weight: 700; background: linear-gradient(transparent 58%, color-mix(in srgb, var(--primary-2) 34%, transparent) 58%) no-repeat; background-size: 100% 100%; }

/* Hero call */
.hc-you, .hc-kai { transform-origin: 50% 50%; }
.hc-slip { color: var(--body); text-decoration: line-through; text-decoration-thickness: 2px; text-decoration-color: var(--lp-bad); }

/* Flow diagram */
.fl-glow { opacity: 0; box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--primary-2) 60%, transparent); background: radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, var(--primary-2) 14%, transparent), transparent 70%); }
.fl-ping { opacity: 0; }
.fl-dash { fill: none; stroke: var(--primary-2); stroke-width: 2; stroke-dasharray: 3 6; stroke-linecap: round; opacity: 0.8; }
.fl-head { fill: none; stroke: var(--primary-2); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; opacity: 0.8; }
.fl-squiggle { text-decoration: underline wavy; text-decoration-color: var(--lp-bad); text-decoration-thickness: 1.5px; text-underline-offset: 5px; }

/* Call timeline */
.ct-playhead { opacity: 0; }

/* Jumble */
.jb-stage { width: 20.85em; height: 10.3em; font-size: clamp(11px, 4.3cqi, 21px); }
.jb-chip {
  width: var(--w); transform: translate(var(--x1), var(--y1)) rotate(0deg) scale(1);
  background: linear-gradient(180deg, color-mix(in srgb, var(--primary-2) 24%, var(--surface-2)), color-mix(in srgb, var(--primary-2) 10%, var(--surface-1)));
  border: 1px solid color-mix(in srgb, var(--primary-2) 45%, transparent);
  box-shadow: 0 8px 18px -10px rgba(0, 0, 0, 0.5);
}
.jb-hint { background: color-mix(in srgb, var(--primary-2) 12%, var(--surface-1)); border: 1px solid color-mix(in srgb, var(--primary-2) 35%, transparent); }
.jb-rail { background: var(--lp-ok); box-shadow: 0 0 12px color-mix(in srgb, var(--lp-ok) 60%, transparent); }

/* Pronunciation */
.pr-voice { transform-origin: 50% 50%; }
.pr-tint { background: color-mix(in srgb, var(--tone) 20%, transparent); border-bottom: 3px solid var(--tone); }
.pr-word-pick { box-shadow: 0 0 0 2px var(--lp-bad); }
.pr-arc, .pg-arc { stroke-dashoffset: var(--off); }

/* Setup */
.lv-step { transform-origin: 50% 100%; border: 1px solid color-mix(in srgb, var(--primary-2) 30%, transparent); border-bottom: 0; background: linear-gradient(180deg, color-mix(in srgb, var(--primary-2) var(--a), transparent), color-mix(in srgb, var(--primary-2) 4%, transparent)); }
.md-hi { opacity: 0; box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--primary-2) 70%, transparent); background: color-mix(in srgb, var(--primary-2) 10%, transparent); }

/* Progress / plans */
.pg-bar { transform-origin: 50% 100%; }
.pc-block { transform-origin: 0 50%; }

@keyframes lp-talk { from { transform: scaleY(0.28); } to { transform: scaleY(1); } }
@keyframes lp-ping { from { transform: scale(1); opacity: 0.55; } to { transform: scale(2.6); opacity: 0; } }

@keyframes hc-you { 0% { transform: scaleY(0.12); } 4%, 40% { transform: scaleY(1); } 45%, 100% { transform: scaleY(0.12); } }
@keyframes hc-kai { 0%, 50% { transform: scaleY(0.12); } 55%, 88% { transform: scaleY(1); } 93%, 100% { transform: scaleY(0.12); } }
@keyframes hc-cap-you { 0%, 3% { opacity: 0; transform: translateY(4px); } 9%, 95% { opacity: 1; transform: none; } 100% { opacity: 0; } }
@keyframes hc-cap-kai { 0%, 52% { opacity: 0; transform: translateY(4px); } 59%, 95% { opacity: 1; transform: none; } 100% { opacity: 0; } }
@keyframes hc-slip { 0%, 26% { color: var(--heading); text-decoration-color: transparent; } 32%, 100% { color: var(--body); text-decoration-color: var(--lp-bad); } }
@keyframes hc-fix { 0%, 62% { background-size: 0% 100%; } 72%, 100% { background-size: 100% 100%; } }
@keyframes hc-xp { 0%, 76% { opacity: 0; transform: translateY(6px) scale(0.9); } 81%, 95% { opacity: 1; transform: none; } 100% { opacity: 0; } }

@keyframes fl-glow { 0% { opacity: 0; } 6%, 30% { opacity: 1; } 36%, 100% { opacity: 0; } }
@keyframes fl-ping { from { transform: scale(1); opacity: 0.6; } to { transform: scale(1.9); opacity: 0; } }
@keyframes fl-dash { to { stroke-dashoffset: -9; } }
@keyframes fl-squig { 0%, 38% { text-decoration-color: transparent; } 44%, 94% { text-decoration-color: var(--lp-bad); } 100% { text-decoration-color: transparent; } }
@keyframes fl-xp { 0%, 68% { opacity: 0; transform: translateY(6px) scale(0.9); } 73%, 95% { opacity: 1; transform: none; } 100% { opacity: 0; } }

@keyframes ct-heard { 0% { clip-path: inset(0 100% 0 0); opacity: 1; } 80%, 94% { clip-path: inset(0 0 0 0); opacity: 1; } 100% { clip-path: inset(0 0 0 0); opacity: 0; } }
@keyframes ct-playhead { 0% { transform: translateX(0); opacity: 1; } 80% { transform: translateX(100%); opacity: 1; } 84%, 100% { transform: translateX(100%); opacity: 0; } }
@keyframes ct-note-pause { 0%, 27% { opacity: 0; transform: translateY(4px); } 31%, 94% { opacity: 1; transform: none; } 100% { opacity: 0; } }
@keyframes ct-note-cut { 0%, 49% { opacity: 0; transform: translateY(4px); } 53%, 94% { opacity: 1; transform: none; } 100% { opacity: 0; } }
@keyframes ct-note-stop { 0%, 53% { opacity: 0; transform: translateY(4px); } 57%, 94% { opacity: 1; transform: none; } 100% { opacity: 0; } }

@keyframes jb-hint { 0%, 2% { opacity: 0; transform: scale(0.9); } 6%, 27% { opacity: 1; transform: none; } 31%, 100% { opacity: 0; transform: scale(0.95); } }
@keyframes jb-rail { 0%, 54% { opacity: 0; } 58%, 92% { opacity: 1; } 96%, 100% { opacity: 0; } }
@keyframes jb-ok { 0%, 55% { opacity: 0; transform: translateY(6px) scale(0.92); } 59%, 92% { opacity: 1; transform: none; } 96%, 100% { opacity: 0; } }

@keyframes pr-voice { 0% { transform: scaleY(0.14); } 3%, 24% { transform: scaleY(1); } 28%, 100% { transform: scaleY(0.14); } }
@keyframes pr-rings { 0%, 24% { opacity: 1; } 27%, 100% { opacity: 0; } }
@keyframes pr-arc { 0%, 48% { stroke-dashoffset: var(--c); } 56%, 95% { stroke-dashoffset: var(--off); } 100% { stroke-dashoffset: var(--c); } }
@keyframes pr-score { 0%, 50% { opacity: 0; } 55%, 95% { opacity: 1; } 100% { opacity: 0; } }
@keyframes pr-pick { 0%, 56% { box-shadow: 0 0 0 0 transparent; } 60%, 95% { box-shadow: 0 0 0 2px var(--lp-bad); } 100% { box-shadow: 0 0 0 0 transparent; } }
@keyframes pr-detail { 0%, 58% { opacity: 0; transform: translateY(-8px) scale(0.97); } 64%, 95% { opacity: 1; transform: none; } 100% { opacity: 0; } }
@keyframes pr-row { 0%, 60% { opacity: 0; transform: translateY(4px); } 66%, 95% { opacity: 1; transform: none; } 100% { opacity: 0; } }

@keyframes lv-grow { from { transform: scaleY(0.15); opacity: 0.3; } }
@keyframes lp-grow-x { from { transform: scaleX(0); } }
@keyframes lo-spin { to { transform: rotate(360deg); } }
@keyframes md-hi { 0% { opacity: 0; } 4%, 14% { opacity: 1; } 18%, 100% { opacity: 0; } }
@keyframes pg-arc { from { stroke-dashoffset: var(--c); } }
@keyframes pg-pop { from { opacity: 0; transform: scale(0.6); } }

@media (prefers-reduced-motion: no-preference) {
  .lp [data-play] .lp-wave[data-live] > i { animation: lp-talk var(--sp, 760ms) ease-in-out infinite alternate; animation-delay: calc(var(--i) * -137ms); }
  .lp [data-play] .lp-live-dot::after { animation: lp-ping 1.8s ease-out infinite; }

  .lp [data-play] .hc-you { animation: hc-you 10s ease-in-out infinite; }
  .lp [data-play] .hc-kai { animation: hc-kai 10s ease-in-out infinite; }
  .lp [data-play] .hc-cap-you { animation: hc-cap-you 10s var(--lp-ease) infinite; }
  .lp [data-play] .hc-cap-kai { animation: hc-cap-kai 10s var(--lp-ease) infinite; }
  .lp [data-play] .hc-slip { animation: hc-slip 10s linear infinite; }
  .lp [data-play] .hc-fix { animation: hc-fix 10s var(--lp-ease) infinite; }
  .lp [data-play] .hc-xp { animation: hc-xp 10s var(--lp-ease) infinite; }

  .lp [data-play] .fl-glow { animation: fl-glow 6s ease-in-out infinite both; animation-delay: calc(var(--n) * 2s); }
  .lp [data-play] .fl-ping { animation: fl-ping 2s ease-out infinite; }
  .lp [data-play] .fl-ping-late { animation-delay: 1s; }
  .lp [data-play] .fl-dash { animation: fl-dash 0.9s linear infinite; }
  .lp [data-play] .fl-squiggle { animation: fl-squig 6s linear infinite; }
  .lp [data-play] .fl-xp { animation: fl-xp 6s var(--lp-ease) infinite; }

  .lp [data-play] .ct-heard { animation: ct-heard 12s linear infinite; }
  .lp [data-play] .ct-playhead { animation: ct-playhead 12s linear infinite; }
  .lp [data-play] .ct-note-pause { animation: ct-note-pause 12s var(--lp-ease) infinite; }
  .lp [data-play] .ct-note-cut { animation: ct-note-cut 12s var(--lp-ease) infinite; }
  .lp [data-play] .ct-note-stop { animation: ct-note-stop 12s var(--lp-ease) infinite; }

  ${jumbleKeyframes}
  .lp [data-play] .jb-hint { animation: jb-hint 9s var(--lp-ease) infinite; }
  .lp [data-play] .jb-rail { animation: jb-rail 9s ease infinite; }
  .lp [data-play] .jb-ok { animation: jb-ok 9s var(--lp-ease) infinite; }

  ${pronKeyframes}
  .lp [data-play] .pr-voice { animation: pr-voice 11s ease-in-out infinite; }
  .lp [data-play] .pr-rings { animation: pr-rings 11s linear infinite; }
  .lp [data-play] .pr-arc { animation: pr-arc 11s var(--lp-ease) infinite; }
  .lp [data-play] .pr-score { animation: pr-score 11s ease infinite; }
  .lp [data-play] .pr-word-pick { animation: pr-pick 11s ease infinite; }
  .lp [data-play] .pr-detail { animation: pr-detail 11s var(--lp-ease) infinite; }
  .lp [data-play] .pr-row { animation: pr-row 11s var(--lp-ease) infinite both; animation-delay: calc(var(--k) * 350ms); }

  .lp [data-play] .lv-step { animation: lv-grow 900ms var(--lp-ease) both; animation-delay: calc(var(--i) * 140ms); }
  .lp [data-play] .lo-ring { animation: lo-spin 90s linear infinite; }
  .lp [data-play] .lo-glyph { animation: lo-spin 90s linear infinite reverse; }
  .lp [data-play] .md-hi { animation: md-hi 9s ease-in-out infinite both; animation-delay: calc(var(--i) * 1.5s); }

  .lp [data-play] .pg-arc { animation: pg-arc 1.6s var(--lp-ease) 200ms both; }
  .lp [data-play] .pg-xp { animation: pg-pop 600ms var(--lp-ease) 1.2s both; }
  .lp [data-play] .pg-dot { animation: pg-pop 500ms var(--lp-ease) both; animation-delay: calc(var(--i) * 28ms); }
  .lp [data-play] .pg-badge { animation: pg-pop 600ms var(--lp-ease) both; animation-delay: calc(var(--i) * 110ms); }
  .lp [data-play] .pg-bar { animation: lv-grow 900ms var(--lp-ease) both; animation-delay: calc(var(--i) * 120ms); }
  .lp [data-play] .pc-block { animation: lp-grow-x 700ms var(--lp-ease) both; animation-delay: calc(var(--i) * 70ms); }
}
`;
