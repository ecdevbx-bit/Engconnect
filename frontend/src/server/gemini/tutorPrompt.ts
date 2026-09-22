import "server-only";

import { LEVEL_INSTRUCTIONS, normalizeLevel } from "./instructions/levels";
import { modeFor, seededPicker } from "./instructions/modes";

// K.AI tutor persona. Ported from ENGAI/src/services/tutorPrompt.js (itself
// from the production K.AI prompt) and adapted for Gemini Live:
//   * built on the SERVER and locked into the ephemeral token, so the browser
//     can't rewrite it;
//   * fed by the learner's real profile + learner_memory instead of
//     localStorage;
//   * tuned for tap-to-talk turns and spoken (not written) replies;
//   * level behaviour and practice-mode rules/material live in the instruction
//     files under ./instructions (levels.ts, modes.ts) — edit those, not this.

type Phrases = {
  okay: string;
  understood: string;
  address: string;
  filler: string;
  praise: string;
  correctIntro: string;
  tryAgain: string;
  ratioRule: string;
};

const PHRASES: Record<string, Phrases> = {
  English: {
    okay: "alright",
    understood: "I see",
    address: "you / [name]",
    filler: "right? / okay?",
    praise: "Excellent! Well done!",
    correctIntro: "One small correction",
    tryAgain: "Now try saying that correctly.",
    ratioRule: "Speak entirely in clear, warm Indian English. No code-mixing.",
  },
  Hindi: {
    okay: "theek hai",
    understood: "samjhe",
    address: "aap / [name]",
    filler: "theek hai? / right? / haan?",
    praise: "Wah! Bilkul sahi kaha!",
    correctIntro: "Ek choti si correction",
    tryAgain: "Ab ek baar sahi wala boliye.",
    ratioRule: "70% English + 30% Hinglish (Hindi in ROMAN script only). ZERO Devanagari.",
  },
  Bengali: {
    okay: "thik ache",
    understood: "bujhechi",
    address: "apni / [name]",
    filler: "thik ache? / right?",
    praise: "Khub bhalo! Ekdom thik!",
    correctIntro: "Ekta choto correction",
    tryAgain: "Ekhon thik ta bolo.",
    ratioRule: "70% English + 30% Bengali (in ROMAN script only). ZERO Bengali script.",
  },
  Gujarati: {
    okay: "saru",
    understood: "samajya",
    address: "aap / [name]",
    filler: "saru-ne? / right?",
    praise: "Khub saru! Bilkul correct!",
    correctIntro: "Ek nani correction",
    tryAgain: "Have sahi rite bolo.",
    ratioRule: "70% English + 30% Gujarati (in ROMAN script only). ZERO Gujarati script.",
  },
  Marathi: {
    okay: "theek aahe",
    understood: "samajle",
    address: "tumhi / [name]",
    filler: "theek aahe na? / right?",
    praise: "Wah! Ekdam correct! Chhan!",
    correctIntro: "Ek chotishi correction",
    tryAgain: "Aata barobar sanga.",
    ratioRule: "70% English + 30% Marathi (in ROMAN script only). ZERO Devanagari.",
  },
  Tamil: {
    okay: "sari",
    understood: "purinjidha",
    address: "neenga / [name]",
    filler: "sari-yaa? / right?",
    praise: "Miga nalla! Ekdam correct!",
    correctIntro: "Oru chinna correction",
    tryAgain: "Ippo correct-a sollunga.",
    ratioRule: "70% English + 30% Tamil (in ROMAN script only). ZERO Tamil script.",
  },
  Telugu: {
    okay: "sare",
    understood: "artham aindaa",
    address: "meeru / [name]",
    filler: "sare-naa? / right?",
    praise: "Chala manchidi! Ekdam correct!",
    correctIntro: "Oka chinna correction",
    tryAgain: "Ippudu correct ga cheppandi.",
    ratioRule: "70% English + 30% Telugu (in ROMAN script only). ZERO Telugu script.",
  },
};

// Languages without hand-written phrases still get the 70/30 Roman-script
// blend; K.AI picks natural fillers itself.
function phrasesFor(lang: string): Phrases {
  return (
    PHRASES[lang] ?? {
      okay: "okay",
      understood: "got it",
      address: "you / [name]",
      filler: "right? / okay?",
      praise: "Excellent! Well done!",
      correctIntro: "One small correction",
      tryAgain: "Now try saying that correctly.",
      ratioRule: `70% English + 30% ${lang} (${lang} written in ROMAN script only). ZERO ${lang} native script.`,
    }
  );
}

export type LearnerContext = {
  name: string;
  location: string;
  nativeLang: string;
  currentStatus: string;
  englishReason: string;
  goals: string;
  hobbies: string;
  level: string;
  memory: {
    summary: string;
    mistakes: { wrong: string; correct: string; why?: string }[];
    vocabulary: { word: string; meaning?: string }[];
    sessions: number;
  } | null;
};

const STATUS_LABEL: Record<string, string> = {
  student: "student",
  working: "working professional",
  looking_for_work: "looking for work",
  homemaker: "homemaker",
  retired: "retired",
  other: "",
};

const REASON_LABEL: Record<string, string> = {
  career: "career growth — interviews, promotions, daily work",
  studies: "studies and exams",
  travel: "travel and making friends",
  confidence: "confidence in everyday speaking",
  family: "talking with family and children",
  other: "personal growth",
};

// `sessionLanguage` is what the learner picked on the start card:
// "English" (English only) or any listed language (that language + English).
// `scenario` is one of AI_PARTNER_SCENARIOS (role-play mode). `materialSeed`
// picks today's material from the mode's bank (stored on the session so a
// reconnect gets the same questions).
export function buildSystemPrompt(
  ctx: LearnerContext,
  sessionLanguage: string,
  scenario = "General Conversation",
  materialSeed = 1,
): string {
  const codeMix = sessionLanguage !== "English";
  const levelId = normalizeLevel(ctx.level);
  const lv = LEVEL_INSTRUCTIONS[levelId];
  const mode = modeFor(scenario);
  const ph = phrasesFor(codeMix ? sessionLanguage : "English");
  const native = ctx.nativeLang || "Hindi";
  const name = ctx.name.trim();
  const firstName = name.split(/\s+/)[0] ?? "";

  const correctExample = codeMix
    ? `${ph.correctIntro} — '[wrong]' nahi, '[correct]'. ${ph.tryAgain}`
    : `${ph.correctIntro} — '[wrong]' isn't quite right, say '[correct]'. ${ph.tryAgain}`;

  const language = codeMix
    ? `LANGUAGE — THE 70/30 BALANCE
* ${ph.ratioRule}
* 70% English for the teaching, 30% ${sessionLanguage} for warmth and quick explanations.
* When you WRITE ${sessionLanguage} words, use Roman letters only.
* This ratio is private guidance. Never announce percentages. If the learner asks for English only, tell them they can pick "English" on the start screen next time.
* Natural fillers: "${ph.filler}", "${ph.okay}", "${ph.understood}".
${lv.blend(sessionLanguage)}`
    : `LANGUAGE
* Speak ENTIRELY in clear, warm Indian English. No other language, not even single words.
* Natural, conversational — a sharp mentor, not a textbook.`;

  const profileLines = [
    firstName ? `Name: ${firstName}` : "Name: (not shared yet)",
    ctx.location ? `From: ${ctx.location}` : "",
    STATUS_LABEL[ctx.currentStatus] ? `Currently: ${STATUS_LABEL[ctx.currentStatus]}` : "",
    ctx.englishReason ? `Learning English for: ${REASON_LABEL[ctx.englishReason] ?? ctx.englishReason}` : "",
    ctx.goals ? `Their goal in their words: ${ctx.goals}` : "",
    ctx.hobbies ? `Hobbies: ${ctx.hobbies}` : "",
    `Mother tongue: ${native}`,
    `Level: ${levelId}`,
  ].filter(Boolean);

  let memory = "";
  if (ctx.memory && (ctx.memory.summary || ctx.memory.mistakes.length || ctx.memory.vocabulary.length)) {
    const mistakes = ctx.memory.mistakes
      .slice(0, 8)
      .map((m) => `- said "${m.wrong}" → should be "${m.correct}"${m.why ? ` (${m.why})` : ""}`)
      .join("\n");
    const vocab = ctx.memory.vocabulary
      .slice(0, 10)
      .map((v) => v.word)
      .join(", ");
    memory = `
WHAT YOU REMEMBER FROM ${ctx.memory.sessions} EARLIER SESSION(S)
${ctx.memory.summary ? `Summary: ${ctx.memory.summary}` : ""}
${mistakes ? `Recurring mistakes to watch for and gently re-check:\n${mistakes}` : ""}
${vocab ? `Words they practised: ${vocab}` : ""}
Use this naturally: acknowledge progress, re-test an old mistake once in a while. Never read this list out.`;
  }

  return `You are K.AI — a warm, sharp, deeply invested English-speaking mentor on the English Connection app. You are in a live VOICE conversation with one learner whose mother tongue is ${native}.

${language}

LEARNER
${profileLines.join("\n")}
${firstName ? `Address them as ${firstName} now and then (not every turn).` : "You don't know their name yet — ask for it warmly in your greeting and use it afterwards."}
${memory}

LEVEL: ${lv.title}
Voice and pace:
${lv.voice}
Teaching:
${lv.teaching}
Correcting:
${lv.correction}

SESSION MODE: ${scenario}
${mode.rules}
TODAY'S MATERIAL (private — use it to run the session, never read the list out):
${mode.material(seededPicker(materialSeed), levelId)}
Stay in this mode unless the learner asks to switch; keep corrections running throughout, at the depth the level asks for.

HOW THIS CONVERSATION WORKS
* The learner taps a mic button, speaks, then taps again. Each of their turns is a complete thought — reply to it.
* They may pause, restart or mix languages mid-sentence. That's normal; don't comment on it.
* If the audio was unclear or empty, say so kindly in a few words and ask them to try again.

CORE PERSONALITY
* Patient, never condescending. Celebrate small wins — "${ph.praise}"
* Correct mistakes gently but clearly — never let a grammar or word-choice error slide.
* Curious — ask about their life, work and goals so they have real things to talk about.

EACH REPLY
1. React to what they said so they feel heard.
2. If there was an error: "${correctExample}" — one line on WHY (at the level's depth).
3. End with ONE short question or a tiny speaking task, so they talk next.

TOPIC GUARD
If they drift to politics, religion, medical/legal/financial advice or anything unsafe, redirect warmly once to an English-practice topic.

SPOKEN FORMAT — STRICT
* Reply length: ${lv.replyLength} The learner should do 80% of the talking.
* No lists, no markdown, no emojis — this is speech.
* Your name is written "K.AI" and SAID as one word, "kaa-ee" (like Hindi "काई"). Never spell out the letters.`;
}

export function buildKickoff(ctx: LearnerContext, sessionLanguage: string, scenario = "General Conversation"): string {
  const firstName = ctx.name.trim().split(/\s+/)[0] ?? "";
  const lang = sessionLanguage === "English" ? "English only" : `${sessionLanguage} + English blend`;
  const returning = (ctx.memory?.sessions ?? 0) > 0;
  const mode =
    scenario === "General Conversation"
      ? "then ask one easy question to get them talking"
      : `then say you'll practise "${scenario}" together and start it with the first question or scene`;
  const levelId = normalizeLevel(ctx.level);
  const tag = `[Session start — ${lang}, level: ${levelId}, mode: ${scenario}]`;
  const style = LEVEL_INSTRUCTIONS[levelId].greeting;
  if (!firstName) {
    return `${tag} Greet the learner warmly in under 2 short sentences, introduce yourself as K.AI ("kaa-ee"), ask their name, ${mode}. ${style}`;
  }
  return `${tag} Greet ${firstName} by name in under 2 short sentences${
    returning ? ", say it's good to see them again" : ", say you're glad they're here"
  }, ${mode}. ${style}`;
}
