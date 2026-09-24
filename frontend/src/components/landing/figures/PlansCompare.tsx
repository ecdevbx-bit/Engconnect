import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Check, Infinity as InfinityIcon, Mic, Puzzle, Sparkles, Trophy, AudioLines } from "lucide-react";

import { cssVars } from "./Wave";

// Free vs Pro as two cards drawn on the SAME scales, so the difference is seen,
// not read:
//   • K.AI time as a week of 7 day-blocks: Free fills one block's worth for the
//     whole week (20 min/week), Pro fills every day (20 min/day);
//   • daily drills as dots per difficulty level (18 Jumble, 3 Pronunciation) vs ∞.
// Limits mirror the defaults in D-015 / D-033 (admin-editable). CTAs are the
// landing's existing ones.

type Plan = "free" | "pro";

export function PlansCompare() {
  return (
    <div data-fig className="grid gap-4 sm:grid-cols-2">
      <PlanCard plan="free" />
      <PlanCard plan="pro" />
    </div>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  const pro = plan === "pro";
  return (
    <article
      aria-labelledby={`plan-${plan}`}
      className={`lp-reveal relative flex flex-col rounded-[28px] p-6 sm:p-7 ${
        pro ? "lp-glass-strong ring-1 ring-primary/40" : "lp-glass"
      }`}
    >
      <h3
        id={`plan-${plan}`}
        className={`flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] ${pro ? "text-primary" : "text-body"}`}
      >
        {pro ? <Sparkles className="h-4 w-4" aria-hidden="true" /> : null}
        {pro ? "Pro" : "Free"}
      </h3>

      <Row icon={<Mic />} label="K.AI talk time">
        <p className="lp-kinetic text-3xl font-bold text-heading">
          20 min<span className="text-lg text-body"> / {pro ? "day" : "week"}</span>
        </p>
        <WeekBlocks pro={pro} />
      </Row>

      <Row icon={<Puzzle />} label="Jumble · daily">
        <Drill pro={pro} free={18} />
      </Row>

      <Row icon={<AudioLines />} label="Pronunciation · daily">
        <Drill pro={pro} free={3} />
      </Row>

      <Row icon={<Trophy />} label="XP, streaks, badges">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-heading">
          <Check className="h-4 w-4" style={{ color: "var(--lp-ok)" }} aria-hidden="true" /> Included
        </span>
      </Row>

      <div className="mt-auto pt-7">
        {pro ? (
          <Link href="/pro" className="lp-btn lp-btn-glass w-full">
            See Pro <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : (
          <Link href="/signup" className="lp-btn lp-btn-primary w-full">
            Start talking — free <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </div>
    </article>
  );
}

function Row({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="mt-6 border-t border-border pt-5">
      <p className="lp-tag flex items-center gap-2 text-body [&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:text-primary">
        {icon}
        {label}
      </p>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}

/** A week of talk time: 7 day-blocks of 20 min. Free = one block for the week. */
function WeekBlocks({ pro }: { pro: boolean }) {
  return (
    <div className="flex gap-1.5" aria-hidden="true">
      {Array.from({ length: 7 }, (_, i) => {
        const on = pro || i === 0;
        return (
          <span
            key={i}
            className={`pc-block h-8 flex-1 rounded-lg ${on ? "" : "border border-dashed border-heading/15"}`}
            style={{ ...cssVars({ "--i": i }), background: on ? "var(--pro-pill)" : "transparent" }}
          />
        );
      })}
    </div>
  );
}

/** Daily drills: Free = N dots per difficulty level; Pro = ∞. */
function Drill({ pro, free }: { pro: boolean; free: number }) {
  if (pro) {
    return (
      <p className="flex min-h-12 items-center gap-2 text-sm font-semibold text-heading">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-primary">
          <InfinityIcon className="h-5 w-5" aria-hidden="true" />
        </span>
        Unlimited
      </p>
    );
  }
  return (
    <div className="flex min-h-12 flex-wrap items-center gap-x-3 gap-y-2">
      <span className="flex max-w-[150px] flex-wrap gap-1" aria-hidden="true">
        {Array.from({ length: free }, (_, i) => (
          <span key={i} className="h-2.5 w-2.5 rounded-full bg-primary/70" />
        ))}
      </span>
      <span className="text-sm font-semibold text-heading">
        {free} a day <span className="font-medium text-body">· per level</span>
      </span>
    </div>
  );
}
