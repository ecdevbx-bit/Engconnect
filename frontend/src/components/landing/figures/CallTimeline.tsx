import type { ReactNode } from "react";
import { Hourglass, Mic, Zap } from "lucide-react";

import { Wave, cssVars } from "./Wave";

// AI Partner — "hands-free" drawn as a call timeline with two lanes (You, K.AI):
//   you talk → you pause → K.AI answers → you cut in → K.AI stops at once.
// A playhead sweeps left→right and "hears" the lanes as it passes (the coloured
// layer is clipped to it); each annotation pops in when the playhead reaches it
// (12 s loop, figureStyles `ct-*`). The only control on a call is mute.
//
// Segment geometry is in % of the track width so it scales from 280 px to 560 px.
const YOU_A = { left: 1, width: 32 };
const KAI = { left: 43, width: 24 }; // ends at 67% — cut short by the interruption
const YOU_B = { left: 63, width: 35 };
const PAUSE = { from: 33, to: 43 };
const CUT_AT = 67;

export function CallTimeline() {
  return (
    <div
      data-fig
      role="img"
      aria-label="A hands-free call on a timeline. You talk, then pause; K.AI answers when you pause. When you cut in, K.AI stops and listens. The only button is mute."
      className="lp-glass-strong w-full rounded-[28px] p-5 sm:p-7"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="lp-tag flex items-center gap-2 text-heading">
          <span className="lp-live-dot" /> Live call
        </span>
        <span className="lp-tag text-body">Hands-free</span>
      </div>

      <div className="mt-5 grid grid-cols-[2.6rem_minmax(0,1fr)] gap-x-3">
        {/* lane labels, aligned with the lane centres (60px / 140px) */}
        <div className="relative h-[200px]">
          <span className="lp-tag absolute top-[60px] -translate-y-1/2 text-body">You</span>
          <span className="lp-tag absolute top-[140px] -translate-y-1/2 text-primary">K.AI</span>
        </div>

        <div className="relative h-[200px]">
          {/* lane guides */}
          <span className="absolute inset-x-0 top-[60px] h-px bg-heading/10" />
          <span className="absolute inset-x-0 top-[140px] h-px bg-heading/10" />

          {/* what hasn't been "heard" yet — muted copies */}
          <Lanes muted />
          {/* what the playhead has passed — full colour (clipped by ct-heard) */}
          <div className="ct-heard absolute inset-0">
            <Lanes />
          </div>

          {/* pause: a gap measure on your lane + its label between the lanes */}
          <div
            className="ct-note ct-note-pause absolute top-[53px] h-[14px] border-x-2 border-primary/60"
            style={{ left: `${PAUSE.from}%`, width: `${PAUSE.to - PAUSE.from}%` }}
          >
            <span className="absolute inset-x-1 top-1/2 border-t-2 border-dotted border-primary/60" />
          </div>
          <Note className="ct-note ct-note-pause top-[100px]" x={(PAUSE.from + PAUSE.to) / 2} icon={<Hourglass />}>
            Pause
          </Note>

          {/* you cut in → K.AI stops */}
          <Note className="ct-note ct-note-cut top-[14px]" x={YOU_B.left + 2} icon={<Zap />} tone="bad">
            You cut in
          </Note>
          <span
            className="ct-note ct-note-stop absolute top-[34px] h-[132px] border-l-2 border-dashed"
            style={{ left: `${CUT_AT}%`, borderColor: "var(--lp-bad)" }}
          />
          <Note className="ct-note ct-note-stop top-[184px]" x={CUT_AT + 1}>
            K.AI stops
          </Note>

          {/* playhead (own clipping layer so it can't widen the page) */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="ct-playhead absolute inset-0">
              <span className="absolute bottom-3 left-0 top-3 w-0.5 -translate-x-1/2 rounded-full bg-primary" />
              <span className="absolute left-0 top-1.5 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-primary" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-3 border-t border-border pt-5">
        <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface-2/80 px-5 text-sm font-bold text-heading">
          <Mic className="h-4 w-4" aria-hidden="true" /> Mute
        </span>
        <span className="lp-tag text-body">The only button</span>
      </div>
    </div>
  );
}

function Lanes({ muted = false }: { muted?: boolean }) {
  const you = muted ? "text-heading/15" : "text-heading/70";
  const kai = muted ? "text-heading/15" : "text-primary";
  return (
    <>
      <Segment {...YOU_A} top={38} className={you} seed={2} n={24} />
      {/* K.AI's answer is drawn longer than it gets to be, then cut at CUT_AT —
          the abrupt edge IS the interruption. */}
      <div className="absolute top-[118px] h-[44px] overflow-hidden" style={{ left: `${KAI.left}%`, width: `${KAI.width}%` }}>
        <Wave n={24} seed={6} spread className={kai} style={{ ...cssVars({ "--wh": "44px" }), width: `${(29 / KAI.width) * 100}%` }} />
      </div>
      <Segment {...YOU_B} top={38} className={you} seed={9} n={26} />
    </>
  );
}

function Segment({
  left,
  width,
  top,
  className,
  seed,
  n,
}: {
  left: number;
  width: number;
  top: number;
  className: string;
  seed: number;
  n: number;
}) {
  return (
    <div className="absolute h-[44px]" style={{ left: `${left}%`, width: `${width}%`, top }}>
      <Wave n={n} seed={seed} spread className={className} style={cssVars({ "--wh": "44px" })} />
    </div>
  );
}

function Note({
  x,
  icon,
  tone,
  className,
  children,
}: {
  x: number;
  icon?: ReactNode;
  tone?: "bad";
  className: string;
  children: ReactNode;
}) {
  return (
    <span
      className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-surface-1/90 px-2.5 py-1 [&_svg]:h-3 [&_svg]:w-3 ${className}`}
      style={{ left: `${x}%`, color: tone === "bad" ? "var(--lp-bad)" : "var(--primary-2)" }}
    >
      {icon}
      <span className="lp-tag text-heading">{children}</span>
    </span>
  );
}
