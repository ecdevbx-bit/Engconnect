import "server-only";

import type { NavTrack, SearchItem } from "@/components/learn/navTypes";
import { LESSONS, TRACKS, lessonPath, lessonsByTrack } from "@/content/learn";

// The public index handed to client components (nav tree + search). Titles,
// summaries, paths and Pro flags only — never lesson bodies or quizzes.
export function publicIndex(isPro: boolean): { tracks: NavTrack[]; items: SearchItem[] } {
  const trackTitle = new Map(TRACKS.map((t) => [t.id, t.title]));
  const tracks: NavTrack[] = TRACKS.map((t) => ({
    id: t.id,
    title: t.title,
    level: t.level,
    href: `/learn/${t.id}`,
    accent: t.accent,
    lessons: lessonsByTrack(t.id).map((l) => ({ title: l.title, href: lessonPath(l), pro: l.pro, locked: l.pro && !isPro })),
  }));
  const items: SearchItem[] = LESSONS.map((l) => ({
    title: l.title,
    summary: l.summary,
    href: lessonPath(l),
    track: trackTitle.get(l.track) ?? "",
    pro: l.pro,
    locked: l.pro && !isPro,
  }));
  return { tracks, items };
}
