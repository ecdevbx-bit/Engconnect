import "server-only";

import { GoogleGenAI, Type } from "@google/genai";

import { env } from "../env";
import { db } from "../supabase";
import { withTextKey } from "./keyPool";
import { parseModelJson } from "./textModel";

// After an AI Partner session, compile the transcript into the learner's
// long-term memory (summary + recurring mistakes + vocabulary). The next
// session's system prompt includes it, so K.AI "remembers" the learner.
// Idea from ENGAI's Karpathy memory, moved from localStorage to Postgres.

type Mistake = { wrong: string; correct: string; why?: string; count: number; lastSeen: string };
type Vocab = { word: string; meaning?: string; lastSeen: string };

const SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "Updated running summary of the learner, max 80 words." },
    mistakes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          wrong: { type: Type.STRING },
          correct: { type: Type.STRING },
          why: { type: Type.STRING },
        },
        required: ["wrong", "correct", "why"],
      },
    },
    vocabulary: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { word: { type: Type.STRING }, meaning: { type: Type.STRING } },
        required: ["word", "meaning"],
      },
    },
  },
  required: ["summary", "mistakes", "vocabulary"],
};

export async function compileSessionMemory(userId: string, sessionId: string): Promise<void> {
  const { data: msgs } = await db()
    .from("chat_messages")
    .select("role, body")
    .eq("session_id", sessionId)
    .order("id")
    .limit(200);
  const userTurns = (msgs ?? []).filter((m) => m.role === "user");
  if (userTurns.length < 2) {
    await db().from("chat_sessions").update({ memory_compiled: true }).eq("id", sessionId);
    return;
  }

  const { data: existing } = await db().from("learner_memory").select("*").eq("user_id", userId).maybeSingle();
  const prevMistakes = ((existing?.mistakes as Mistake[]) ?? []).slice(0, 20);
  const prevVocab = ((existing?.vocabulary as Vocab[]) ?? []).slice(0, 30);

  const transcript = (msgs ?? [])
    .map((m) => `${m.role === "user" ? "Learner" : "K.AI"}: ${String(m.body).slice(0, 500)}`)
    .join("\n")
    .slice(-12000);

  const { result } = await withTextKey(userId, async (apiKey) => {
    const ai = new GoogleGenAI({ apiKey, httpOptions: { timeout: 20_000 } });
    const res = await ai.models.generateContent({
      model: env.geminiTextModel(),
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Previous summary: ${existing?.summary || "(none)"}

Transcript of today's spoken English practice (learner's speech is auto-transcribed and may contain recognition noise — ignore obvious transcription glitches):
${transcript}

Return:
- summary: an updated running summary of who the learner is, their level, interests and progress (max 80 words; merge with the previous summary).
- mistakes: up to 6 genuine grammar/word-choice mistakes the LEARNER made today (not K.AI), with the correct form and a 6-word reason.
- vocabulary: up to 6 useful words/phrases the learner used or was taught today, with a short meaning.`,
            },
          ],
        },
      ],
      config: { responseMimeType: "application/json", responseSchema: SCHEMA, temperature: 0.2, maxOutputTokens: 1500 },
    });
    return parseModelJson<{
      summary?: string;
      mistakes?: { wrong: string; correct: string; why?: string }[];
      vocabulary?: { word: string; meaning?: string }[];
    }>(res);
  });

  const now = new Date().toISOString();
  const mistakes = [...prevMistakes];
  for (const m of result.mistakes ?? []) {
    if (!m.wrong || !m.correct) continue;
    const hit = mistakes.find((x) => x.correct.toLowerCase() === m.correct.toLowerCase());
    if (hit) {
      hit.count += 1;
      hit.lastSeen = now;
      hit.wrong = m.wrong;
    } else {
      mistakes.push({ wrong: m.wrong, correct: m.correct, why: m.why, count: 1, lastSeen: now });
    }
  }
  mistakes.sort((a, b) => b.count - a.count || b.lastSeen.localeCompare(a.lastSeen));

  const vocab = [...prevVocab];
  for (const v of result.vocabulary ?? []) {
    if (!v.word) continue;
    const hit = vocab.find((x) => x.word.toLowerCase() === v.word.toLowerCase());
    if (hit) hit.lastSeen = now;
    else vocab.unshift({ word: v.word, meaning: v.meaning, lastSeen: now });
  }

  await db()
    .from("learner_memory")
    .upsert({
      user_id: userId,
      summary: (result.summary ?? existing?.summary ?? "").slice(0, 800),
      mistakes: mistakes.slice(0, 20),
      vocabulary: vocab.slice(0, 30),
      sessions: ((existing?.sessions as number) ?? 0) + 1,
    });
  await db().from("chat_sessions").update({ memory_compiled: true }).eq("id", sessionId);
}
