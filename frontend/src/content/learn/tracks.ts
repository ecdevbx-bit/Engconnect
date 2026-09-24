import type { Track } from "./types";

// Order here is the order of the learning path (index page, sidebar, prev/next).
export const TRACKS: Track[] = [
  {
    id: "beginner",
    title: "Beginner",
    level: "A1–A2",
    levelName: "Beginner",
    blurb: "Build sentences you can say today.",
    accent: "#10b981",
  },
  {
    id: "intermediate",
    title: "Intermediate",
    level: "B1–B2",
    levelName: "Intermediate",
    blurb: "Tenses, modals and ideas that connect.",
    accent: "#0ea5e9",
  },
  {
    id: "advanced",
    title: "Advanced",
    level: "C1",
    levelName: "Advanced",
    blurb: "Nuance, emphasis and natural-sounding English.",
    accent: "#8b5cf6",
  },
  {
    id: "career",
    title: "Speaking & Career",
    level: "B1–C1",
    levelName: "Intermediate to advanced",
    blurb: "Interviews, emails, meetings and IELTS.",
    accent: "#f59e0b",
  },
];
