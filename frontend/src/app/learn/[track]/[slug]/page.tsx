import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock } from "lucide-react";

import { LessonSection } from "@/components/learn/LessonSection";
import { LevelChip, LockedCard, PracticeCtas, PrevNext } from "@/components/learn/LessonExtras";
import { ProMark } from "@/components/learn/ProMark";
import Quiz from "@/components/learn/Quiz";
import { getLesson, getTrack, lessonPath, lessonSeoTitle, neighbors, type Lesson } from "@/content/learn";

import { HIDDEN_METADATA, SITE_URL, getLearnAccess, learnMetadata } from "../../access";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ track: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { track, slug } = await params;
  const { open, isPublic } = await getLearnAccess();
  const lesson = getLesson(track, slug);
  if (!open || !lesson) return HIDDEN_METADATA;
  return learnMetadata({ title: lessonSeoTitle(lesson), description: lesson.summary, path: lessonPath(lesson), isPublic });
}

export default async function LessonPage({ params }: Props) {
  const { track: trackId, slug } = await params;
  const { open, viewer } = await getLearnAccess();
  const lesson = getLesson(trackId, slug);
  const track = getTrack(trackId);
  if (!open || !lesson || !track) notFound();

  // PRO GATE — decided here on the server. A locked lesson renders only its
  // first section; the other sections and the quiz are never rendered or
  // passed to a client component, so they are not in the HTML or RSC payload.
  const locked = lesson.pro && !viewer.isPro;
  const sections = locked ? lesson.sections.slice(0, 1) : lesson.sections;
  const hidden = lesson.sections.length - sections.length;

  const { prev, next } = neighbors(lesson);
  const link = (l?: Lesson) => l && { title: l.title, href: lessonPath(l), pro: l.pro, locked: l.pro && !viewer.isPro };

  return (
    <article className="space-y-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(lesson, track.levelName, track.level) }} />

      <header>
        <nav aria-label="Breadcrumb" className="-my-2 flex flex-wrap items-center text-sm text-muted-foreground">
          <Link href="/learn" className="inline-flex min-h-11 items-center hover:text-heading">Learn</Link>
          <span className="mx-2" aria-hidden>/</span>
          <Link href={`/learn/${track.id}`} className="inline-flex min-h-11 items-center hover:text-heading">{track.title}</Link>
        </nav>
        <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight text-heading sm:text-4xl">{lesson.title}</h1>
        <p className="mt-3 text-base leading-relaxed text-body sm:text-lg">{lesson.summary}</p>
        <p className="mt-4 flex flex-wrap items-center gap-2">
          <LevelChip level={track.level} name={track.levelName} accent={track.accent} />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-bold text-heading">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {lesson.minutes} min
          </span>
          {lesson.pro && <ProMark locked={locked} className="px-2 py-1 text-[11px]" />}
        </p>
      </header>

      {sections.map((s, i) => (
        <LessonSection key={i} section={s} n={i + 1} id={`s-${i + 1}`} />
      ))}

      {locked ? (
        <LockedCard hiddenSections={hidden} signedIn={viewer.signedIn} path={lessonPath(lesson)} />
      ) : (
        <>
          <Quiz key={lessonPath(lesson)} questions={lesson.quiz} />
          <PracticeCtas drill={lesson.drill ?? "jumble"} />
        </>
      )}

      <PrevNext prev={link(prev)} next={link(next)} />
    </article>
  );
}

// schema.org LearningResource. `<` is escaped so lesson text can never close the script tag.
function jsonLd(lesson: Lesson, levelName: string, cefr: string): string {
  const url = `${SITE_URL}${lessonPath(lesson)}`;
  const data = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: lesson.title,
    description: lesson.summary,
    url,
    inLanguage: "en",
    learningResourceType: "Lesson",
    educationalLevel: `${levelName} (CEFR ${cefr})`,
    isAccessibleForFree: !lesson.pro,
    timeRequired: `PT${lesson.minutes}M`,
    teaches: lesson.title,
    provider: { "@type": "Organization", name: "English Connection", url: SITE_URL },
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
