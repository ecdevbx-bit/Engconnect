// Shapes passed from the server layout to the client nav/search components.
// Only public fields (titles, summaries, paths, Pro flags) — never lesson bodies.

export type NavLesson = { title: string; href: string; pro: boolean; locked: boolean };

export type NavTrack = { id: string; title: string; level: string; href: string; accent: string; lessons: NavLesson[] };

export type SearchItem = { title: string; summary: string; href: string; track: string; pro: boolean; locked: boolean };
