"use client";

import dynamic from "next/dynamic";
import { LazyMount } from "./LazyMount";

// The three looping feature demos — the only heavy, purely illustrative parts of
// the landing — code-split and mounted only near the viewport (their JS isn't
// even downloaded until then), and unmounted again when scrolled far away so
// their timers and <canvas> mascots stop. Each wrapper has a fixed height, so
// the swap never moves the page. Everything with real copy (headings, mascot
// labels, progress cards) is server-rendered elsewhere, never behind this.

const AiPartnerDemo = dynamic(() => import("./AiPartnerDemo").then((m) => m.AiPartnerDemo), { ssr: false });
const JumbleDemo = dynamic(() => import("./JumbleDemo").then((m) => m.JumbleDemo), { ssr: false });
const PronunciationDemo = dynamic(() => import("./PronunciationDemo").then((m) => m.PronunciationDemo), {
  ssr: false,
});
export type LazyDemoKind = "ai" | "jumble" | "pronunciation";

function Placeholder({ label }: { label?: string }) {
  return (
    <div className="lp-glass-strong grid h-full w-full place-items-center rounded-[28px]" aria-hidden="true">
      {label ? (
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
      ) : null}
    </div>
  );
}

const DEMO_LABEL: Record<LazyDemoKind, string> = {
  ai: "AI Partner",
  jumble: "Jumble Words",
  pronunciation: "Pronunciation Coach",
};

/** One looping feature demo. Purely visual: `inert` keeps its fake buttons out
 *  of the tab order and the screen-reader tree (the text beside it explains). */
export function LazyDemo({ kind, className }: { kind: LazyDemoKind; className: string }) {
  const Demo = kind === "ai" ? AiPartnerDemo : kind === "jumble" ? JumbleDemo : PronunciationDemo;
  return (
    // Horizontal margin too: on desktop the panels arrive sideways (pinned swipe).
    <LazyMount
      className={className}
      rootMargin="320px 25%"
      unmountOnExit
      placeholder={<Placeholder label={DEMO_LABEL[kind]} />}
    >
      <div inert className="flex h-full w-full">
        <Demo />
      </div>
    </LazyMount>
  );
}
