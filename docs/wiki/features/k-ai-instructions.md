---
title: K.AI instruction files (levels + practice modes)
type: feature
tags: [ai-partner, prompt, levels, ielts, instructions]
links: [features/ai-partner, architecture/gemini-live]
updated: 2026-09-22
---

# K.AI instruction files — how K.AI teaches at each level and in each mode

Everything K.AI is told about **how to teach** lives in two plain instruction files. Edit the
wording there to change behaviour; the next session after a deploy uses it (D-032). They are
pasted into the system prompt that the server locks into the Gemini Live token
([[architecture/gemini-live]]), so learners can't change them.

| File | What it controls |
|---|---|
| `frontend/src/server/gemini/instructions/levels.ts` | Voice & pace, teaching style, correction depth, how much of the learner's language to mix in, reply length and greeting — per level |
| `frontend/src/server/gemini/instructions/modes.ts` | Rules for each practice mode + the **material banks** K.AI is fed (IELTS cue cards, interview questions, role-play scenes, grammar points, conversation topics) |
| `frontend/src/server/gemini/tutorPrompt.ts` | Assembles the prompt: persona, language blend, learner profile + memory, then the level and mode blocks |

## Levels (learner picks one on the start card)
| Level | How K.AI behaves |
|---|---|
| **Beginner** (A0–A1) | Speaks **softly and slowly** with pauses; only very common words; one idea per sentence; gives the sentence and says "say with me"; checks understanding with yes/no questions; accepts answers in the learner's language and turns them into English; explains only the ONE most important mistake per turn but always models a fully correct sentence; a "say it after me" repeat is the only ask in that reply; up to half the learner's language for explanations (if a blend was chosen); replies under ~25 words |
| **Intermediate** (A2–B1) | Friendly, slightly slower than native; pushes full sentences, past/future, one new phrase at a time; corrects every error briefly with a one-line reason and asks for a repeat; 70/30 blend; under 35 words |
| **Expert** (B2–C1) | Natural confident pace; opinions, comparisons, "argue the other side"; idioms, phrasal verbs, collocations, tone; corrects subtle errors fast and suggests more natural phrasing; English almost only; under 45 words |

"Advanced" was renamed **Expert**; old saved setups and sessions are mapped automatically.

## Practice modes and their material
Each session gets a **different slice** of the mode's bank, picked with a random seed that is
saved on the session (`chat_sessions.material_seed`) so a reconnect rebuilds the same prompt.
| Mode | Rules | Material per session |
|---|---|---|
| ☕ Casual chat | Natural conversation; use topics when talk slows | 3 conversation starters (family, food, festivals, cricket, dream job…) |
| 💼 Job interview | Realistic interviewer; one question at a time; feedback + STAR coaching; wrap-up tip after 5–6 | 6 questions (Beginner: 1 fresher question + 4) |
| 🎓 IELTS / TOEFL | Examiner runs Part 1 → Part 2 cue card (1 min to think, up to 2 to speak) → Part 3; a tip per part on one of the four criteria; **estimated band range** at the end, always called an estimate | 3 Part-1 topics, 1 cue card (12 original cards), 3 Part-3 questions |
| ✈️ Travel & shopping | Sets the scene in one line, stays in character, steps out only to correct | 3 scenes (airport, hotel, café, station, pharmacy, auto fare…) |
| 🏢 Office talk | Plays manager/colleague/client; coaches polite, professional phrasing | 3 scenes (stand-up, leave request, late delivery call…) |
| 🎯 Grammar workout | Example → learner's own sentence → check → one-line rule → second try; prefers the learner's own recurring mistakes from memory | 2 focus points for the level |

## What else K.AI is fed ("the data force-fed to the AI")
- **Learner profile** from onboarding: name, city, status, why they learn English, goals, hobbies,
  mother tongue.
- **Memory** from earlier sessions (`learner_memory`): running summary, recurring mistakes, words
  practised — compiled after each session ([[features/ai-partner]]).
- **Session setup**: language blend, level, mode, voice.

## Verify a change
`node scripts/ai-partner-probe.mjs <appUrl> <Level> "<Mode>" <Language>` starts a real session
through the API and prints K.AI's replies to two scripted learner turns. 2026-09-22: Beginner +
Hindi modelled "I have worked in a bank for two years", said "Mere saath boliye…"; Expert + IELTS
opened Part 1 with the session's topics and corrected "buyed → bought" in one line. Production run
(Beginner + Job Interview + Hindi) showed two issues — replies asked two things at once, and one
modelled sentence kept an error ("since two years") — so the Beginner rules now say: the modelled
sentence must be 100% correct, and a "say it after me" repeat is the only task in that reply (next
question afterwards). Re-probe: corrections correct ("for two years", "went … bought"), one ask per reply.
