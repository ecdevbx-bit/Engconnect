import Link from "next/link";
import { ArrowLeft, ArrowRight, AudioLines, Lock, MessageCircle, Puzzle } from "lucide-react";

import { ProMark } from "./ProMark";

// Server-rendered pieces around a lesson: the Pro lock, practice CTAs, and
// previous/next links.

const primaryBtn =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-primary-1 to-primary-2 px-5 text-sm font-bold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";
const ghostBtn =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-surface-2 px-5 text-sm font-semibold text-heading transition hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

/** Shown instead of the rest of a Pro lesson. Receives only a count — never the locked content. */
export function LockedCard({ hiddenSections, signedIn, path }: { hiddenSections: number; signedIn: boolean; path: string }) {
  return (
    <section aria-labelledby="locked-title" className="c-box relative overflow-hidden rounded-2xl">
      {/* decorative "more to come" preview — shapes only, no real content */}
      <div aria-hidden className="pointer-events-none space-y-3 px-6 pt-6 opacity-50 [mask-image:linear-gradient(to_bottom,black,transparent)]">
        <div className="h-4 w-2/5 rounded-full bg-surface-3" />
        <div className="flex gap-2">
          <div className="h-8 w-16 rounded-lg bg-sky-500/25" />
          <div className="h-8 w-20 rounded-lg bg-orange-500/25" />
          <div className="h-8 w-14 rounded-lg bg-emerald-500/25" />
        </div>
        <div className="h-3 w-4/5 rounded-full bg-surface-3" />
        <div className="h-3 w-3/5 rounded-full bg-surface-3" />
      </div>
      <div className="relative flex flex-col items-center px-6 pb-8 pt-2 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full text-white" style={{ background: "var(--pro-pill)" }}>
          <Lock className="h-5 w-5" aria-hidden />
        </span>
        <h2 id="locked-title" className="mt-4 text-xl font-bold text-heading">
          Unlock this lesson with Pro
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-body">
          {hiddenSections > 0 ? `${hiddenSections} more ${hiddenSections === 1 ? "section" : "sections"} and the quick check` : "The quick check"} are
          part of Pro — along with unlimited practice and daily K.AI time.
        </p>
        <div className="mt-5 flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Link href="/pro" className={primaryBtn}>
            Unlock with Pro <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          {!signedIn && (
            <Link href={`/login?next=${encodeURIComponent(path)}`} className={ghostBtn}>
              Already Pro? Sign in
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

export function PracticeCtas({ drill }: { drill: "jumble" | "pronunciation" }) {
  const drillCta =
    drill === "pronunciation"
      ? { href: "/dashboard/pronunciation", title: "Drill it", sub: "Say the tricky words and get a score.", Icon: AudioLines }
      : { href: "/dashboard/jumble", title: "Drill it", sub: "Rebuild sentences in Jumble Words.", Icon: Puzzle };
  const cards = [
    { href: "/dashboard/ai-partner", title: "Practise with K.AI", sub: "Use it in a real voice conversation.", Icon: MessageCircle },
    drillCta,
  ];
  return (
    <nav aria-label="Practise this lesson" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {cards.map(({ href, title, sub, Icon }) => (
        <Link
          key={href}
          href={href}
          className="c-box group flex min-h-[72px] items-center gap-3 rounded-2xl p-4 transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold text-heading">{title}</span>
            <span className="block text-sm text-muted-foreground">{sub}</span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      ))}
    </nav>
  );
}

type Neighbor = { title: string; href: string; pro: boolean; locked: boolean };

export function PrevNext({ prev, next }: { prev?: Neighbor; next?: Neighbor }) {
  if (!prev && !next) return null;
  return (
    <nav aria-label="More lessons" className="grid grid-cols-1 gap-3 border-t border-border pt-6 sm:grid-cols-2">
      {prev ? (
        <Link
          href={prev.href}
          className="c-box group flex min-h-16 min-w-0 items-center gap-3 rounded-xl px-4 py-3 hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="min-w-0">
            <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Previous</span>
            <span className="flex items-center gap-2 font-semibold leading-snug text-heading">
              <span className="min-w-0">{prev.title}</span>
              {prev.pro && <ProMark locked={prev.locked} />}
            </span>
          </span>
        </Link>
      ) : (
        <span className="hidden sm:block" />
      )}
      {next && (
        <Link
          href={next.href}
          className="c-box group flex min-h-16 min-w-0 items-center justify-end gap-3 rounded-xl px-4 py-3 text-right hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="min-w-0">
            <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Next</span>
            <span className="flex items-center justify-end gap-2 font-semibold leading-snug text-heading">
              <span className="min-w-0">{next.title}</span>
              {next.pro && <ProMark locked={next.locked} />}
            </span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        </Link>
      )}
    </nav>
  );
}

export function LevelChip({ level, name, accent }: { level: string; name: string; accent: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold text-heading"
      style={{
        backgroundColor: `color-mix(in oklab, ${accent} 14%, transparent)`,
        borderColor: `color-mix(in oklab, ${accent} 45%, transparent)`,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} aria-hidden />
      {level} · {name}
    </span>
  );
}
