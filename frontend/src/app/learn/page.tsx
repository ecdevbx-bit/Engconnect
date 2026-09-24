import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CircleCheck, Eye, MessageCircle } from "lucide-react";

import { LearnSearch } from "@/components/learn/LearnSearch";
import { ProMark } from "@/components/learn/ProMark";
import { TrackArt } from "@/components/learn/TrackArt";
import { LESSONS, TRACKS, getLesson, lessonPath, lessonsByTrack } from "@/content/learn";

import { HIDDEN_METADATA, getLearnAccess, learnMetadata } from "./access";
import { publicIndex } from "./nav";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { open, isPublic } = await getLearnAccess();
  if (!open) return HIDDEN_METADATA;
  return learnMetadata({
    title: "Learn English free: grammar and speaking lessons",
    description: "Free visual English lessons for Indian learners — grammar, speaking and career English, from beginner to advanced.",
    path: "/learn",
    isPublic,
  });
}

const START_HERE: [string, string][] = [
  ["beginner", "sentence-order"],
  ["beginner", "am-is-are"],
  ["beginner", "common-indian-english-mistakes"],
];

const STEPS = [
  { Icon: Eye, title: "See it", sub: "A diagram per rule" },
  { Icon: CircleCheck, title: "Check it", sub: "3 quick questions" },
  { Icon: MessageCircle, title: "Say it", sub: "Practise with K.AI" },
];

export default async function LearnIndexPage() {
  const { open, viewer } = await getLearnAccess();
  if (!open) notFound();

  const free = LESSONS.filter((l) => !l.pro).length;
  const start = START_HERE.flatMap(([t, s]) => {
    const l = getLesson(t, s);
    return l ? [l] : [];
  });
  const { items: searchItems } = publicIndex(viewer.isPro);

  return (
    <div className="space-y-12">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Free English library</p>
        <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight text-heading sm:text-4xl">
          Learn English, one picture at a time.
        </h1>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-body">
          Short rules, clear diagrams, Indian examples — from basics to pro.
        </p>
        <p className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
          <span className="rounded-full bg-surface-2 px-3 py-1">{LESSONS.length} lessons</span>
          <span className="rounded-full bg-surface-2 px-3 py-1">{TRACKS.length} tracks</span>
          <span className="rounded-full bg-surface-2 px-3 py-1">{free} free</span>
        </p>
        <div className="mt-6 lg:hidden">
          <LearnSearch items={searchItems} />
        </div>
      </header>

      <section aria-labelledby="how">
        <h2 id="how" className="sr-only">How each lesson works</h2>
        <ol className="grid grid-cols-3 gap-2 sm:gap-3">
          {STEPS.map(({ Icon, title, sub }, i) => (
            <li key={title} className="c-box flex flex-col items-center gap-1.5 rounded-2xl px-2 py-4 text-center sm:flex-row sm:gap-3 sm:px-4 sm:text-left">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span>
                <span className="block text-sm font-bold text-heading">
                  <span className="sr-only">Step {i + 1}: </span>
                  {title}
                </span>
                <span className="block text-xs text-muted-foreground">{sub}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="start-here">
        <h2 id="start-here" className="text-lg font-bold text-heading">Start here</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-3">
          {start.map((l, i) => (
            <li key={l.slug}>
              <Link
                href={lessonPath(l)}
                className="c-box group flex h-full min-h-[88px] flex-col justify-between gap-2 rounded-2xl p-4 transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Step {i + 1} · {l.minutes} min</span>
                <span className="flex items-center justify-between gap-2 font-bold leading-snug text-heading">
                  {l.title}
                  <ArrowRight className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="tracks">
        <h2 id="tracks" className="text-lg font-bold text-heading">Pick your level</h2>
        <ul className="mt-3 grid gap-4 sm:grid-cols-2">
          {TRACKS.map((t) => {
            const lessons = lessonsByTrack(t.id);
            const pro = lessons.filter((l) => l.pro).length;
            const access = pro === 0 ? "all free" : pro === lessons.length ? "Pro" : `${lessons.length - pro} free · ${pro} Pro`;
            return (
              <li key={t.id}>
                <Link
                  href={`/learn/${t.id}`}
                  className="c-box group flex h-full flex-col overflow-hidden rounded-2xl transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span
                    className="flex h-28 items-center justify-center text-heading"
                    style={{ backgroundColor: `color-mix(in oklab, ${t.accent} 10%, transparent)` }}
                  >
                    <TrackArt id={t.id} accent={t.accent} className="h-20 w-auto" />
                  </span>
                  <span className="flex flex-1 flex-col gap-1.5 p-4">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-lg font-bold text-heading">{t.title}</span>
                      <span className="rounded-full border border-border px-2 py-0.5 text-xs font-bold text-heading">{t.level}</span>
                    </span>
                    <span className="text-sm text-body">{t.blurb}</span>
                    <span className="mt-auto flex items-center justify-between gap-2 pt-2 text-xs font-semibold text-muted-foreground">
                      <span className="flex items-center gap-2">
                        {lessons.length} lessons · {access}
                        {pro > 0 && <ProMark locked={!viewer.isPro} />}
                      </span>
                      <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {!viewer.isPro && (
        <p className="c-box flex flex-col gap-3 rounded-2xl p-4 text-sm text-body sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2">
            <ProMark locked />
            <span>Pro lessons open with a free preview. Unlock the rest with Pro.</span>
          </span>
          <Link href="/pro" className="inline-flex min-h-11 items-center gap-1.5 font-bold text-primary hover:underline">
            See Pro <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </p>
      )}
    </div>
  );
}
