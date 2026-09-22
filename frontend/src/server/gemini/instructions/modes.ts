import "server-only";

import type { LevelId } from "./levels";

// ─────────────────────────────────────────────────────────────────────────────
// K.AI PRACTICE-MODE INSTRUCTIONS + MATERIAL BANKS
//
// Instruction file: `rules` says how K.AI runs each mode; the banks are the
// material it is fed for a session. Every session picks a small, different
// slice (seeded, so a reconnect gets the same slice) and pastes it into the
// system prompt as "TODAY'S MATERIAL". Add or edit items freely — keep them
// short, India-relevant and original (no copied exam papers).
//
// Mode ids must match AI_PARTNER_SCENARIOS in lib/aiPartnerOptions.ts.
// ─────────────────────────────────────────────────────────────────────────────

type Mode = {
  rules: string;
  /** Builds today's material from the banks with a seeded picker. */
  material: (pick: Picker, level: LevelId) => string;
};

// ── Banks ───────────────────────────────────────────────────────────────────

const CASUAL_TOPICS = [
  "their family and who they live with",
  "favourite food and a dish from their home town",
  "what they did last weekend",
  "a festival they love and how they celebrate it",
  "a film, web series or song they enjoyed recently",
  "cricket or another sport they follow or play",
  "their dream job or business",
  "a happy childhood memory",
  "life in their city — good and bad",
  "a place in India they want to visit",
  "their phone — the apps they use most",
  "their morning routine",
  "a friend who is important to them",
  "something new they want to learn this year",
];

const IELTS_PART1 = [
  "hometown", "work or studies", "your home", "hobbies", "food and cooking", "weather and seasons",
  "public transport", "mobile phones", "shopping", "music", "reading", "sports and exercise",
  "friends", "festivals", "sleep", "photographs", "the internet", "morning routines",
];

// Original cue cards in the Part 2 format: topic + "You should say" points.
const IELTS_CUE_CARDS = [
  "Describe a person who taught you something important. You should say: who they are, what they taught you, how they taught it, and explain why it mattered to you.",
  "Describe a place you visited that you would like to go back to. You should say: where it is, when you went, what you did there, and explain why you want to return.",
  "Describe a skill you learned as an adult. You should say: what the skill is, how you learned it, how long it took, and explain how it helps you now.",
  "Describe a festival or celebration you enjoy. You should say: what it is, when it happens, what people do, and explain why you enjoy it.",
  "Describe a time you were late for something important. You should say: what the event was, why you were late, what happened, and explain how you felt.",
  "Describe a book, film or series that made you think. You should say: what it was, when you read or watched it, what it was about, and explain why it made you think.",
  "Describe a useful app or website you use often. You should say: what it is, how you found it, what you use it for, and explain why it is useful.",
  "Describe a memorable journey. You should say: where you went, how you travelled, who you were with, and explain why it was memorable.",
  "Describe a goal you want to achieve in the next few years. You should say: what the goal is, why you chose it, what you are doing to reach it, and explain how you will feel when you achieve it.",
  "Describe a time you helped someone. You should say: who you helped, what the situation was, what you did, and explain how you felt afterwards.",
  "Describe a traditional dish from your region. You should say: what it is, how it is made, when people eat it, and explain why you like or dislike it.",
  "Describe a public place in your city that you like. You should say: where it is, what people do there, how often you go, and explain why you like it.",
];

const IELTS_PART3 = [
  "How has technology changed the way people learn?",
  "Should schools teach practical life skills? Why or why not?",
  "Why do some people prefer living in big cities?",
  "How are festivals changing in modern India?",
  "Is it better to work for a big company or a small one?",
  "What makes a good teacher?",
  "How will transport in Indian cities change in the next 20 years?",
  "Do people read less today than in the past? Why?",
  "Why is it important to keep traditional food alive?",
  "Should people be encouraged to travel within their own country first?",
];

const INTERVIEW_QUESTIONS = [
  "Tell me about yourself.",
  "Why do you want this role?",
  "What are your strengths?",
  "What is one weakness you are working on?",
  "Tell me about a challenge you faced and how you handled it.",
  "Tell me about a time you worked in a team.",
  "Tell me about a mistake you made and what you learned.",
  "Why should we hire you?",
  "Where do you see yourself in five years?",
  "Why are you leaving your current job?",
  "How do you handle pressure and deadlines?",
  "Tell me about a project you are proud of.",
  "What are your salary expectations?",
  "Do you have any questions for us?",
];

const INTERVIEW_FRESHER = [
  "Tell me about your final-year project.",
  "Why did you choose your course?",
  "How did you spend your internship or holidays?",
  "What have you learned outside your syllabus?",
];

const TRAVEL_SCENES = [
  "Airport check-in counter: the learner is checking in; one bag is overweight.",
  "Hotel front desk: the learner has a booking, but the room is not ready yet.",
  "Café: the learner orders food and asks about something on the menu.",
  "Railway station enquiry: the learner asks about a delayed train and the platform.",
  "Pharmacy: the learner explains a mild cold and asks for advice.",
  "Clothes shop: the learner wants to exchange a shirt that doesn't fit.",
  "Asking a stranger for directions to a metro station.",
  "Auto or taxi: agreeing the fare and giving directions.",
  "Phoning a hotel to change the booking date.",
  "Immigration desk abroad: purpose of visit and length of stay.",
];

const OFFICE_SCENES = [
  "Morning stand-up: give a short update on yesterday, today and any blocker.",
  "Asking the manager for two days' leave next week.",
  "Client call: the delivery will be two days late — explain politely and offer a plan.",
  "Small talk with a new colleague at lunch.",
  "Presenting one idea to improve the team's work in one minute.",
  "Disagreeing politely with a colleague's plan in a meeting.",
  "Asking a senior for help with a task you're stuck on.",
  "Following up on an email that got no reply.",
  "Negotiating a new deadline with a teammate.",
  "Introducing yourself on your first day in a new team.",
];

const GRAMMAR_FOCUS: Record<LevelId, string[]> = {
  Beginner: [
    "am / is / are (I am, she is, they are)",
    "simple present for habits (I eat, she eats)",
    "a / an with jobs and things (a teacher, an engineer)",
    "question words: what, where, who, when",
    "this / that / these / those",
    "can / can't for ability",
  ],
  Intermediate: [
    "past simple — did + base verb (I didn't know, NOT didn't knew)",
    "present perfect vs past simple (I have lived / I lived)",
    "since vs for",
    "prepositions of time: at / on / in",
    "will vs going to for plans",
    "subject–verb agreement (he goes, they go)",
    "question forms (Where do you work? NOT Where you work?)",
  ],
  Expert: [
    "conditionals (if I had known …, I would have …)",
    "reported speech (she said that …)",
    "modals of deduction (must be, might have been)",
    "articles with abstract nouns and general statements",
    "phrasal verbs in professional English (follow up, carry out, bring up)",
    "passive voice for formal reports",
    "softening language (I was wondering if …, It might be better to …)",
  ],
};

// ── Modes ───────────────────────────────────────────────────────────────────

export const MODES: Record<string, Mode> = {
  "General Conversation": {
    rules: `Warm, natural everyday conversation about the learner's life, work, hobbies and plans. Follow their interests; bring in today's topics when the talk slows down.`,
    material: (pick) => `Conversation starters for today (use when needed, in any order): ${pick(CASUAL_TOPICS, 3).join("; ")}.`,
  },

  "Job Interview": {
    rules: `You are a friendly but realistic interviewer for the learner's field (ask their target role in the first turn if you don't know it).
* Ask ONE interview question at a time and let them answer fully.
* After each answer: one line of feedback (what was good + one improvement), then the next question.
* Coach the STAR method for experience questions (Situation, Task, Action, Result) and suggest stronger professional phrasing.
* After 5–6 questions, give a short overall tip and offer to repeat the hardest question.`,
    material: (pick, level) =>
      `Interview questions for today, in this order: ${[
        ...(level === "Beginner" ? pick(INTERVIEW_FRESHER, 1) : []),
        ...pick(INTERVIEW_QUESTIONS, level === "Beginner" ? 4 : 6),
      ].join(" | ")}`,
  },

  "IELTS Speaking": {
    rules: `You are an IELTS Speaking examiner and coach. Run the test in order and say which part you are in.
* PART 1 (about 4 minutes): short questions about familiar topics, 2–3 questions per topic.
* PART 2: read the cue card aloud, tell them they have 1 minute to think (say "Take a minute to think — tap the mic when you're ready"), then they speak for up to 2 minutes. Don't interrupt a long answer; ask one short rounding-off question after.
* PART 3 (about 4 minutes): deeper discussion questions linked to the Part 2 topic; push for reasons, examples and comparisons.
* After each part: one quick tip on ONE of the four criteria — Fluency & Coherence, Lexical Resource, Grammatical Range & Accuracy, Pronunciation.
* At the end: an estimated band range per criterion (be honest, e.g. "around 6 to 6.5") and the single most useful thing to practise next. Always say it is an estimate, not an official score.`,
    material: (pick) =>
      `Part 1 topics: ${pick(IELTS_PART1, 3).join(", ")}.
Part 2 cue card: ${pick(IELTS_CUE_CARDS, 1)[0]}
Part 3 questions (adapt to the cue card topic): ${pick(IELTS_PART3, 3).join(" | ")}`,
  },

  "Travel & Daily Life": {
    rules: `Role-play everyday situations. Set the scene in one line ("I'm the hotel receptionist, you just arrived…"), then stay in character as the other person. Step out of character only to correct a mistake or teach a useful phrase, then continue the scene. When a scene ends, start the next one.`,
    material: (pick) => `Scenes for today, in this order: ${pick(TRAVEL_SCENES, 3).join(" | ")}`,
  },

  "Office & Workplace": {
    rules: `Role-play workplace English. You play the manager, colleague or client. Set the scene in one line, stay in character, and coach polite, professional phrasing (softeners, clear structure) after each of their turns.`,
    material: (pick) => `Workplace scenes for today, in this order: ${pick(OFFICE_SCENES, 3).join(" | ")}`,
  },

  "Grammar Workout": {
    rules: `Run a focused speaking drill. For each focus point: give one short example, ask them to make their own sentence, check it, explain the rule in one line, then give a second sentence to try. Prefer the learner's own recurring mistakes (from memory) over today's list.`,
    material: (pick, level) => `Grammar focus for today: ${pick(GRAMMAR_FOCUS[level], 2).join(" | ")}.`,
  },
};

export function modeFor(scenario: string): Mode {
  return MODES[scenario] ?? MODES["General Conversation"];
}

// ── Seeded picker (same seed ⇒ same material, so reconnects stay consistent) ──

export type Picker = <T>(items: T[], n: number) => T[];

export function seededPicker(seed: number): Picker {
  let s = seed >>> 0 || 1;
  const rand = () => {
    // mulberry32
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return (items, n) => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, Math.min(n, copy.length));
  };
}
