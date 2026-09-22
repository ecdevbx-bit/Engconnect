// Landing-only CSS (rendered once by ShowcaseV4 in a <style> tag, scoped under
// `.lp`). Kept out of globals.css on purpose: the glass look is a marketing-page
// treatment, while the app itself stays flat.
//
// Performance rules this file follows (the owner asked for a light page):
// - Motion is CSS: transform/opacity keyframes and scroll-driven animations
//   (`animation-timeline`); browsers without scroll timelines simply show
//   everything, un-animated. The one exception is the two scroll "swipes"
//   (landing/ScrollSwipe), which lazy-load GSAP only where they run.
// - The ambient background is a few radial gradients (no `filter: blur`, no
//   canvas). Only two of them drift, slowly, and not at all for reduced motion.
// - Real `backdrop-filter` blur is opt-in (`.lp-blur`) and used only where
//   content actually sits underneath: the fixed nav and the hero caption card.
//   Every other surface is "glass-lite": translucent fill + sheen + hairline border,
//   which looks the same over the already-soft orbs and costs nothing.
// - Every colour flips with the theme (next-themes puts `.light`/`.dark` on
//   <html>); text always sits on a fill opaque enough for >= 4.5:1 contrast.
export const LANDING_CSS = `
.lp {
  --lp-fill: rgba(40, 40, 48, 0.45);
  --lp-fill-strong: rgba(31, 31, 36, 0.78);
  --lp-stroke: rgba(255, 255, 255, 0.09);
  --lp-hl: rgba(255, 255, 255, 0.10);
  --lp-sheen: linear-gradient(150deg, rgba(255, 255, 255, 0.075), rgba(255, 255, 255, 0) 42%);
  --lp-shadow: inset 0 1px 0 0 var(--lp-hl), 0 20px 44px -24px rgba(0, 0, 0, 0.7);
  --lp-orb-a: rgba(249, 115, 22, 0.22);
  --lp-orb-b: rgba(0, 227, 253, 0.09);
  --lp-orb-c: rgba(183, 159, 255, 0.13);
  --lp-orb-d: rgba(245, 158, 11, 0.13);
  --lp-grid: rgba(255, 255, 255, 0.035);
  --lp-star: #f59e0b;
  --lp-glow-1: rgba(251, 146, 60, 0.5);
  --lp-glow-2: rgba(249, 115, 22, 0.24);
  --lp-glow-3: rgba(234, 88, 12, 0.08);
  --lp-ease: cubic-bezier(0.16, 1, 0.3, 1);
}
.light .lp {
  --lp-fill: rgba(255, 255, 255, 0.58);
  --lp-fill-strong: rgba(255, 255, 255, 0.86);
  --lp-stroke: rgba(20, 28, 46, 0.09);
  --lp-hl: rgba(255, 255, 255, 0.95);
  --lp-sheen: linear-gradient(150deg, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0) 50%);
  --lp-shadow: inset 0 1px 0 0 var(--lp-hl), 0 18px 40px -22px rgba(20, 28, 46, 0.28);
  --lp-orb-a: rgba(41, 118, 199, 0.20);
  --lp-orb-b: rgba(14, 116, 144, 0.12);
  --lp-orb-c: rgba(255, 185, 85, 0.30);
  --lp-orb-d: rgba(200, 79, 124, 0.09);
  --lp-grid: rgba(20, 28, 46, 0.045);
  --lp-star: #d97706;
  --lp-glow-1: rgba(255, 185, 85, 0.55);
  --lp-glow-2: rgba(41, 118, 199, 0.16);
  --lp-glow-3: rgba(41, 118, 199, 0.05);
}

.lp-kinetic { font-family: var(--ff-kinetic), var(--font-display), sans-serif; letter-spacing: -0.025em; }

/* ── Ambient background ─────────────────────────────────────────────────── */
.lp-bg { position: fixed; inset: 0; z-index: -1; overflow: hidden; pointer-events: none; contain: strict; }
.lp-orb { position: absolute; border-radius: 9999px; will-change: transform; }
.lp-orb-a { width: 62vmax; height: 62vmax; left: -22vmax; top: -24vmax; background: radial-gradient(closest-side, var(--lp-orb-a), transparent); }
.lp-orb-b { width: 56vmax; height: 56vmax; right: -24vmax; top: 18vh; background: radial-gradient(closest-side, var(--lp-orb-b), transparent); }
.lp-orb-c { width: 58vmax; height: 58vmax; left: 8vw; bottom: -30vmax; background: radial-gradient(closest-side, var(--lp-orb-c), transparent); }
.lp-orb-d { width: 40vmax; height: 40vmax; left: 38vw; top: -18vmax; background: radial-gradient(closest-side, var(--lp-orb-d), transparent); }
.lp-grid {
  position: absolute; inset: 0;
  background-image: linear-gradient(var(--lp-grid) 1px, transparent 1px), linear-gradient(90deg, var(--lp-grid) 1px, transparent 1px);
  background-size: 56px 56px;
  -webkit-mask-image: radial-gradient(ellipse 70% 55% at 50% 0%, #000 30%, transparent 75%);
  mask-image: radial-gradient(ellipse 70% 55% at 50% 0%, #000 30%, transparent 75%);
}
@keyframes lp-drift-a { to { transform: translate3d(8vmax, 6vmax, 0) scale(1.08); } }
@keyframes lp-drift-b { to { transform: translate3d(-7vmax, 8vmax, 0) scale(0.94); } }

/* ── Glass surfaces ─────────────────────────────────────────────────────── */
.lp-glass { background: var(--lp-sheen), var(--lp-fill); border: 1px solid var(--lp-stroke); box-shadow: var(--lp-shadow); }
.lp-glass-strong { background: var(--lp-sheen), var(--lp-fill-strong); border: 1px solid var(--lp-stroke); box-shadow: var(--lp-shadow); }
.lp-blur { -webkit-backdrop-filter: blur(16px) saturate(150%); backdrop-filter: blur(16px) saturate(150%); }
/* Demo cards (they keep .c-box for the other showcase pages; on the landing
   they become frosted panels — opaque enough for the dense UI inside). */
.lp [data-lp-card].c-box { background: var(--lp-sheen), var(--lp-fill-strong); border-color: var(--lp-stroke); box-shadow: var(--lp-shadow); }

/* ── Buttons ────────────────────────────────────────────────────────────── */
.lp-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
  min-height: 48px; padding: 0 1.5rem; border-radius: 9999px;
  font-size: 0.9375rem; font-weight: 700; line-height: 1; white-space: nowrap;
  cursor: pointer; touch-action: manipulation;
  transition: transform 200ms var(--lp-ease), box-shadow 200ms ease-out, background-color 200ms ease-out;
}
.lp-btn:hover { transform: translateY(-1px); }
.lp-btn:active { transform: scale(0.97); transition-duration: 120ms; }
.lp-btn-primary {
  background: var(--pro-pill); color: var(--primary-foreground);
  box-shadow: 0 12px 28px -12px color-mix(in srgb, var(--primary-2) 75%, transparent);
}
.lp-btn-primary:hover { box-shadow: 0 16px 34px -12px color-mix(in srgb, var(--primary-2) 85%, transparent); }
.lp-btn-glass { background: var(--lp-sheen), var(--lp-fill); border: 1px solid var(--lp-stroke); color: var(--heading); box-shadow: var(--lp-shadow); }
.lp-btn-glass:hover { background: var(--lp-sheen), var(--lp-fill-strong); }

/* Visible, theme-aware focus ring on everything interactive in the page. */
.lp :focus-visible { outline: 2px solid var(--primary-2); outline-offset: 3px; }

/* Nav: the shared AccountChip / ThemeToggle keep their own styles; here they
   only get a 44px touch target. */
.lp-nav-tools [data-slot="button"] { height: 44px; }
.lp-nav-tools > button { width: 44px; height: 44px; }

/* Stars / gradient headline helper (theme primary ramp). */
.lp-star { color: var(--lp-star); fill: currentColor; }
.lp-grad-text { background: linear-gradient(100deg, var(--primary-1), var(--primary-2)); -webkit-background-clip: text; background-clip: text; color: transparent; }

/* Transcript marks in the hero caption card: the slip and the fix. */
.lp-slip { text-decoration: line-through; text-decoration-color: var(--pink); text-decoration-thickness: 2px; color: var(--body); }
.lp-fix { font-weight: 700; color: var(--heading); background: linear-gradient(transparent 62%, color-mix(in srgb, var(--primary-2) 32%, transparent) 62%); }

/* ── Scroll swipes (driven by landing/ScrollSwipe; static until it runs) ── */
/* Feature panels: stacked by default; pinned + sliding sideways on desktop. */
@media (min-width: 1024px) {
  .lp-swipe[data-swipe="on"] { height: 100vh; overflow: hidden; }
  .lp-swipe[data-swipe="on"] [data-swipe-track] { display: flex; width: max-content; height: 100%; }
  .lp-swipe[data-swipe="on"] [data-swipe-panel] {
    display: flex; align-items: center; flex-shrink: 0;
    width: 100vw; height: 100vh; max-width: none; margin: 0; padding: 6.5rem 4rem 2.5rem;
  }
  .lp-swipe[data-swipe="on"] [data-swipe-panel] > * { width: 100%; max-width: 80rem; margin-inline: auto; }
  .lp-swipe[data-swipe="on"] [data-col] { order: 0; }
  .lp-swipe[data-swipe="on"] [data-swipe-frame] { height: min(var(--frame-h), calc(100vh - 9rem)); }
}
/* Reviews: a natively scrollable row by default; scrubbed by scroll when on. */
.lp-reviews [data-swipe-viewport] { overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; overscroll-behavior-x: contain; }
.lp-reviews [data-swipe-viewport]::-webkit-scrollbar { display: none; }
.lp-reviews [data-swipe-track] > li { scroll-snap-align: center; }
.lp-reviews[data-swipe="on"] [data-swipe-viewport] { overflow: hidden; scroll-snap-type: none; }

/* ── Scroll progress (scroll-driven; hidden where unsupported) ──────────── */
.lp-progress { display: none; position: absolute; inset: 0 0 auto 0; height: 3px; transform-origin: 0 50%; transform: scaleX(0); background: var(--pro-pill); }
@keyframes lp-progress { to { transform: scaleX(1); } }
@supports (animation-timeline: scroll()) {
  .lp-progress { display: block; animation: lp-progress linear both; animation-timeline: scroll(root block); }
}

/* ── Motion (only when the visitor hasn't asked for less) ───────────────── */
@keyframes lp-rise { from { opacity: 0; transform: translate3d(0, 14px, 0); } }
@keyframes lp-line { from { transform: translate3d(0, 105%, 0); } }
@keyframes lp-pop { from { opacity: 0; transform: translate3d(0, 10px, 0) scale(0.96); } }
@keyframes lp-reveal { from { opacity: 0; transform: translate3d(0, 28px, 0); } }
.lp-mask { display: block; overflow: hidden; padding-bottom: 0.08em; margin-bottom: -0.08em; }
.lp-mask > span { display: block; }
@media (prefers-reduced-motion: no-preference) {
  .lp-orb-a { animation: lp-drift-a 28s ease-in-out infinite alternate; }
  .lp-orb-b { animation: lp-drift-b 34s ease-in-out infinite alternate; }
  .lp-rise { animation: lp-rise 420ms var(--lp-ease) both; animation-delay: var(--d, 0ms); }
  .lp-pop { animation: lp-pop 420ms var(--lp-ease) both; animation-delay: var(--d, 0ms); }
  .lp-mask > span { animation: lp-line 480ms var(--lp-ease) both; animation-delay: var(--d, 0ms); }
  @supports (animation-timeline: view()) {
    /* Fully shown ~160px after it starts entering, whatever its height. */
    .lp-reveal { animation: lp-reveal linear both; animation-timeline: view(); animation-range: entry 0% entry 160px; }
  }
}
@media (prefers-reduced-motion: reduce) {
  .lp *, .lp *::before, .lp *::after { scroll-behavior: auto !important; }
  .lp .lp-btn:hover { transform: none; }
}
`;
