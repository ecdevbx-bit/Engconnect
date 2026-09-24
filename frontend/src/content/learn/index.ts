// Learn library — the public API of the lesson data.
//
// SERVER-ONLY on purpose: the full lesson bodies (including Pro sections and
// quizzes) live in these modules, so a client component importing them would
// ship every Pro lesson to every browser. Pages pass client components only
// what the viewer may see (see app/learn/**).
import "server-only";

import { ADVANCED } from "./advanced";
import { BEGINNER } from "./beginner";
import { CAREER } from "./career";
import { INTERMEDIATE } from "./intermediate";
import { TRACKS } from "./tracks";
import type { Lesson, Track, TrackId } from "./types";

export type * from "./types";
export { TRACKS };

/** Every lesson, in learning-path order (track order, then lesson order). */
export const LESSONS: Lesson[] = [...BEGINNER, ...INTERMEDIATE, ...ADVANCED, ...CAREER];

export function getTrack(id: string): Track | undefined {
  return TRACKS.find((t) => t.id === id);
}

export function lessonsByTrack(track: TrackId | string): Lesson[] {
  return LESSONS.filter((l) => l.track === track);
}

export function getLesson(track: string, slug: string): Lesson | undefined {
  return LESSONS.find((l) => l.track === track && l.slug === slug);
}

export function lessonPath(l: Pick<Lesson, "track" | "slug">): string {
  return `/learn/${l.track}/${l.slug}`;
}

/** Previous / next lesson across the whole path (crosses track boundaries). */
export function neighbors(lesson: Lesson): { prev?: Lesson; next?: Lesson } {
  const i = LESSONS.findIndex((l) => l.track === lesson.track && l.slug === lesson.slug);
  if (i < 0) return {};
  return { prev: LESSONS[i - 1], next: LESSONS[i + 1] };
}

/** Every Learn URL, for the sitemap. `pro` lessons still have a public preview. */
export function learnPaths(): { path: string; pro: boolean }[] {
  return [
    { path: "/learn", pro: false },
    ...TRACKS.map((t) => ({ path: `/learn/${t.id}`, pro: false })),
    ...LESSONS.map((l) => ({ path: lessonPath(l), pro: l.pro })),
  ];
}

/** Page title for a lesson (used by generateMetadata). */
export function lessonSeoTitle(l: Lesson): string {
  if (l.seoTitle) return l.seoTitle;
  return l.track === "career" ? `${l.title}: phrases and examples` : `${l.title}: rules and examples`;
}
