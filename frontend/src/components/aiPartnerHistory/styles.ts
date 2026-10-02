// Shared class strings for the K.AI history screen. Theme tokens only (no
// hard-coded white/black) so the dark and `.light` themes both read well.
// Every control is at least 44px tall for touch.

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export const primaryButton = `inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-primary-1 to-primary-2 px-5 text-sm font-bold text-primary-foreground transition hover:brightness-105 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 ${focusRing}`;

export const secondaryButton = `inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-surface-2 px-5 text-sm font-semibold text-heading transition hover:bg-surface-3 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 ${focusRing}`;

export const dangerButton = `inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-surface-2 px-5 text-sm font-semibold text-destructive transition hover:border-destructive/40 hover:bg-destructive/10 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 ${focusRing}`;

// Tinted rather than a solid red fill: white on the dark theme's #ff5470 is
// under 4.5:1, while red text on a red tint passes in both themes.
export const strongDangerButton = `inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-destructive/45 bg-destructive/15 px-5 text-sm font-bold text-destructive transition hover:bg-destructive/25 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 ${focusRing}`;

export const quietButton = `inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-semibold text-muted-foreground transition hover:bg-surface-2 hover:text-heading ${focusRing}`;

export const focusable = focusRing;

/** Small uppercase label above a group or section ("eyebrow"). */
export const eyebrow = "text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground";

/** A tile that sits one tier above a c-box panel. */
export const tile = "rounded-2xl border border-border bg-surface-2 p-4";

export const chip =
  "inline-flex min-h-7 items-center gap-1 rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-semibold text-heading";
