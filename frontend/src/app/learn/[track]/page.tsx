import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Clock } from "lucide-react";

import { LevelChip } from "@/components/learn/LessonExtras";
import { ProMark } from "@/components/learn/ProMark";
import { TrackArt } from "@/components/learn/TrackArt";
import { TRACKS, getTrack, lessonPath, lessonsByTrack } from "@/content/learn";

import { HIDDEN_METADATA, getLearnAccess, learnMetadata } from "../access";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ track: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { track: id } = await params;
  const { open, isPublic } = await getLearnAccess();
  const track = getTrack(id);
  if (!open || !track) return HIDDEN_METADATA;
  const n = lessonsByTrack(track.id).length;
  return learnMetadata({
    title: `${track.title} English (${track.level}): ${n} visual lessons`,
    description: `${track.blurb} ${n} short lessons with diagrams, examples and quick checks.`,
    path: `/learn/${track.id}`,
    isPublic,
  });
}

export default async function TrackPage({ params }: Props) {
  const { track: id } = await params;
  const { open, viewer } = await getLearnAccess();
  const track = getTrack(id);
  if (!open || !track) notFound();

  const lessons = lessonsByTrack(track.id);
  const nextTrack = TRACKS[TRACKS.findIndex((t) => t.id === track.id) + 1];

  return (
    <div className="space-y-8">
      <nav aria-label="Breadcrumb" className="-my-2 flex flex-wrap items-center text-sm text-muted-foreground">
        <Link href="/learn" className="inline-flex min-h-11 items-center hover:text-heading">Learn</Link>
        <span className="mx-2" aria-hidden>/</span>
        <span className="inline-flex min-h-11 items-center text-heading" aria-current="page">{track.title}</span>
      </nav>

      <header className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <span
          className="flex h-24 w-full shrink-0 items-center justify-center rounded-2xl text-heading sm:w-40"
          style={{ backgroundColor: `color-mix(in oklab, ${track.accent} 10%, transparent)` }}
        >
          <TrackArt id={track.id} accent={track.accent} className="h-16 w-auto" />
        </span>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-heading">{track.title}</h1>
          <p className="mt-1.5 text-base text-body">{track.blurb}</p>
          <p className="mt-3 flex flex-wrap items-center gap-2">
            <LevelChip level={track.level} name={track.levelName} accent={track.accent} />
            <span className="text-xs font-semibold text-muted-foreground">{lessons.length} lessons</span>
          </p>
        </div>
      </header>

      <ol className="space-y-3">
        {lessons.map((l, i) => {
          const locked = l.pro && !viewer.isPro;
          return (
            <li key={l.slug}>
              <Link
                href={lessonPath(l)}
                className="c-box group flex items-start gap-4 rounded-2xl p-4 transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full border text-sm font-extrabold text-heading"
                  style={{
                    backgroundColor: `color-mix(in oklab, ${track.accent} 14%, transparent)`,
                    borderColor: `color-mix(in oklab, ${track.accent} 45%, transparent)`,
                  }}
                  aria-hidden
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-bold leading-snug text-heading">{l.title}</span>
                    {l.pro && <ProMark locked={locked} />}
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-body">{l.summary}</span>
                  <span className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" aria-hidden />
                    {l.minutes} min{locked ? " · free preview" : ""}
                  </span>
                </span>
                <ArrowRight className="mt-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ol>

      {nextTrack && (
        <Link
          href={`/learn/${nextTrack.id}`}
          className="flex min-h-11 items-center justify-end gap-2 text-sm font-bold text-primary hover:underline"
        >
          Next track: {nextTrack.title} ({nextTrack.level}) <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      )}
    </div>
  );
}
