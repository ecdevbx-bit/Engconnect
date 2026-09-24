import { Mic, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { Wave, cssVars } from "./Wave";

// Hero figure — one live K.AI call in a single glance: your voice → your words
// (the slip gets struck out) → K.AI's voice → the fix (in Hindi + English mode,
// K.AI's real "ek choti si correction" phrasing) → XP. The one control is mute.
// A 10 s CSS loop (figureStyles `hc-*`); `data-play` is set in the markup so it
// starts on first paint (the hero is on screen at load).
export function HeroCall({ className }: { className?: string }) {
  return (
    <figure
      data-fig
      data-play=""
      role="img"
      aria-label="A live, hands-free call. You say: “I am work here since 2019.” K.AI answers out loud with the fix: “I have worked here since 2019.” You earn XP. The only button is mute."
      className={cn("lp-glass-strong lp-blur rounded-3xl p-4 sm:p-5", className)}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="lp-tag flex items-center gap-2 text-heading">
          <span className="lp-live-dot" /> Live
        </span>
        <span className="lp-tag text-body">Hindi + English</span>
      </div>

      <div className="mt-4 grid grid-cols-[2.6rem_minmax(0,1fr)] items-start gap-x-3 gap-y-4">
        <span className="lp-tag pt-2 text-body">You</span>
        <div>
          <Wave n={38} seed={2} live spread className="hc-you text-heading/60" style={cssVars({ "--wh": "26px" })} />
          <p className="hc-cap-you mt-2 text-sm leading-snug text-heading">
            I <span className="hc-slip">am work</span> here since 2019.
          </p>
        </div>

        <span className="lp-tag pt-2 text-primary">K.AI</span>
        <div>
          <Wave n={38} seed={5} live spread className="hc-kai text-primary" style={cssVars({ "--wh": "26px" })} />
          <p className="hc-cap-kai mt-2 text-sm leading-snug text-heading">
            Ek choti si correction — “I <span className="hc-fix">have worked</span> here since 2019.”
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
        <span className="hc-xp inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1.5 text-xs font-bold text-primary">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> +30 XP
        </span>
        <span className="flex items-center gap-2.5">
          <span className="lp-tag text-body">Mute</span>
          <span className="grid h-10 w-10 place-items-center rounded-full border border-border bg-surface-2/80 text-heading">
            <Mic className="h-4 w-4" aria-hidden="true" />
          </span>
        </span>
      </div>
    </figure>
  );
}
