import type { ReactNode } from "react";
import { ArrowRight, Ear, Mic, Repeat, Sparkles } from "lucide-react";

import { Wave, cssVars } from "./Wave";

// "How it works" — the whole product loop as a three-node flow diagram:
//   1 You speak → 2 K.AI listens (and catches the slip) → 3 Fix + XP → say it again.
// Nodes light up in turn (6 s loop), connectors flow, the loop-back arrow closes
// the circle. Columns on desktop, a vertical flow on phones. Pure HTML/SVG + CSS
// (figureStyles `fl-*`).

// Width of each connector column on desktop — the loop-back arrow is positioned
// from it, so keep the two in sync.
const GAP = 96;

export function FlowDiagram() {
  return (
    <div
      data-fig
      role="img"
      aria-label="How it works. Step 1: you speak. Step 2: K.AI listens and catches the slip. Step 3: you hear the fix and earn XP — then you say it again."
      className="relative"
    >
      <div className="grid lg:grid-cols-[1fr_var(--gap)_1fr_var(--gap)_1fr]" style={cssVars({ "--gap": `${GAP}px` })}>
        <FlowNode n={0} label="You speak">
          <div className="flex items-center gap-4">
            <span className="relative grid h-14 w-14 place-items-center">
              <span className="fl-ping absolute inset-0 rounded-full bg-primary/30" />
              <span className="fl-ping fl-ping-late absolute inset-0 rounded-full bg-primary/25" />
              <span
                className="relative grid h-14 w-14 place-items-center rounded-full text-primary-foreground"
                style={{ background: "var(--pro-pill)" }}
              >
                <Mic className="h-6 w-6" aria-hidden="true" />
              </span>
            </span>
            <Wave n={16} seed={3} live className="text-primary" style={cssVars({ "--wh": "44px", "--gap": "4px" })} />
          </div>
        </FlowNode>

        <Connector />

        <FlowNode n={1} label="K.AI listens">
          <div className="flex w-full max-w-[250px] flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                <Ear className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
              <Wave n={22} seed={7} spread className="text-heading/30" style={cssVars({ "--wh": "22px" })} />
            </div>
            <p className="rounded-2xl rounded-tl-md bg-surface-2/80 px-4 py-2.5 text-[0.95rem] font-medium text-heading">
              I <span className="fl-squiggle">am work</span> here.
            </p>
          </div>
        </FlowNode>

        <Connector />

        <FlowNode n={2} label="Fix + XP">
          <div className="flex flex-col items-center gap-3">
            <p className="flex items-center gap-2 rounded-2xl bg-surface-2/80 px-4 py-2.5 text-[0.95rem] font-semibold">
              <span className="lp-struck text-body">am work</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="lp-marked text-heading">have worked</span>
            </p>
            <span
              className="fl-xp inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold text-primary-foreground"
              style={{ background: "var(--pro-pill)" }}
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> +30 XP
            </span>
          </div>
        </FlowNode>
      </div>

      {/* Loop back: step 3 → step 1 (desktop: an arrow under the row). */}
      <div className="relative mt-1 hidden h-16 lg:block">
        <div
          className="absolute top-0 h-11 rounded-b-[26px] border-2 border-t-0 border-dashed border-primary/40"
          style={{ left: `calc((100% - ${GAP * 2}px) / 6)`, right: `calc((100% - ${GAP * 2}px) / 6)` }}
        />
        <svg
          viewBox="0 0 14 10"
          className="absolute -top-1.5 h-2.5 w-3.5 -translate-x-1/2 fill-none stroke-primary/70"
          style={{ left: `calc((100% - ${GAP * 2}px) / 6 + 1px)` }}
          aria-hidden="true"
        >
          <path d="M1 9 L7 2 L13 9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <LoopPill className="absolute left-1/2 top-11 -translate-x-1/2 -translate-y-1/2" />
      </div>
      <div className="mt-4 flex justify-center lg:hidden">
        <LoopPill />
      </div>
    </div>
  );
}

function FlowNode({ n, label, children }: { n: number; label: string; children: ReactNode }) {
  return (
    <div className="fl-node lp-glass relative overflow-hidden rounded-[28px] p-5 sm:p-6" style={cssVars({ "--n": n })}>
      <span className="fl-glow pointer-events-none absolute inset-0 rounded-[inherit]" />
      <div className="relative flex items-center gap-3">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 font-mono text-xs font-bold text-primary">
          {n + 1}
        </span>
        <span className="text-lg font-bold text-heading">{label}</span>
      </div>
      <div className="relative mt-5 flex h-[112px] items-center justify-center">{children}</div>
    </div>
  );
}

function Connector() {
  return (
    <div className="flex h-12 items-center justify-center lg:h-auto">
      <svg viewBox="0 0 12 48" className="h-12 w-3 overflow-visible lg:hidden" aria-hidden="true">
        <line x1="6" y1="4" x2="6" y2="38" className="fl-dash" />
        <path d="M1.5 35 L6 42 L10.5 35" className="fl-head" />
      </svg>
      <svg viewBox={`0 0 ${GAP} 12`} className="hidden h-3 w-full overflow-visible lg:block" aria-hidden="true">
        <line x1="12" y1="6" x2={GAP - 18} y2="6" className="fl-dash" />
        <path d={`M${GAP - 21} 1.5 L${GAP - 14} 6 L${GAP - 21} 10.5`} className="fl-head" />
      </svg>
    </div>
  );
}

function LoopPill({ className = "" }: { className?: string }) {
  return (
    <span className={`lp-glass-strong inline-flex items-center gap-2 rounded-full px-3.5 py-2 ${className}`}>
      <Repeat className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
      <span className="lp-tag text-heading">Say it again</span>
    </span>
  );
}
