import "server-only";

import { GoogleGenAI, Type } from "@google/genai";

import { isProRow, type ProfileRow } from "../domain/users";
import { isAdminEmail } from "../guards";
import { db } from "../supabase";
import { env } from "../env";
import { parseModelJson, TEXT_CALL_TIMEOUT_MS, withTextModel } from "./textModel";

// K.AI memory (D-047) — what happens after a conversation ends:
//
//   chat_messages ──chunk──▶ chat_session_chunks ──reduce──▶ chat_sessions.digest
//        (raw)              (long chats only)                (title, summary, topics,
//                                                             facts, corrections, words,
//                                                             next-time tip)
//                                              ──compact──▶ learner_memory.memory_md (Pro)
//
// The memory file is a short Markdown document K.AI "writes for itself". It is
// re-compacted after every conversation (so it never grows without bound) and
// goes into the next session's locked system prompt — that is how Gemini
// remembers. Free learners keep the lighter structured memory (summary,
// recurring mistakes, words) that existed before.
//
// Everything runs after the response (`after()`), and is retried by a catch-up
// pass (`digestPendingSessions`) for conversations whose tab vanished.

const CHUNK_CHARS = 3500; // ≈ 30–40 spoken lines
const MAX_CHUNKS = 8; // more than the longest Pro session (20 min)
const MAX_LINE_CHARS = 500;
export const MEMORY_MD_MAX = 3000; // chars sent to Gemini each session
const CLAIM_STALE_MS = 3 * 60_000;
const MAX_ATTEMPTS = 3;

export type SessionDigest = {
  title: string;
  summary: string;
  topics: string[];
  facts: string[];
  mistakes: { wrong: string; correct: string; why: string }[];
  vocabulary: { word: string; meaning: string }[];
  nextTime: string;
};

type Mistake = { wrong: string; correct: string; why?: string; count: number; lastSeen: string };
type Vocab = { word: string; meaning?: string; lastSeen: string };

const TRANSCRIPT_NOTE =
  "The learner's speech is auto-transcribed and may contain recognition noise — ignore obvious transcription glitches. Only the LEARNER's mistakes count, never K.AI's.";

const NO_SECRETS =
  "Never record phone numbers, email or street addresses, passwords, ID or bank numbers — leave them out entirely.";

const CHUNK_SCHEMA = {
  type: Type.OBJECT,
  properties: { notes: { type: Type.STRING, description: "Dense notes on this part of the conversation, max 120 words." } },
  required: ["notes"],
};

const DIGEST_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "3–6 word title, like a chat title. No quotes." },
    summary: { type: Type.STRING, description: "What happened in this conversation, max 60 words, second person (\"You talked about…\")." },
    topics: { type: Type.ARRAY, items: { type: Type.STRING }, description: "1–5 short topic labels." },
    facts: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Up to 6 things the learner shared about themselves (job, plans, family, likes)." },
    mistakes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { wrong: { type: Type.STRING }, correct: { type: Type.STRING }, why: { type: Type.STRING } },
        required: ["wrong", "correct", "why"],
      },
      description: "Up to 6 genuine grammar/word-choice mistakes the learner made, with the correct form and a 6-word reason.",
    },
    vocabulary: {
      type: Type.ARRAY,
      items: { type: Type.OBJECT, properties: { word: { type: Type.STRING }, meaning: { type: Type.STRING } }, required: ["word", "meaning"] },
      description: "Up to 6 useful words/phrases the learner used or was taught, with a short meaning.",
    },
    nextTime: { type: Type.STRING, description: "One concrete idea for the next conversation, max 20 words." },
    learnerSummary: { type: Type.STRING, description: "Updated running summary of who the learner is, their level, interests and progress (max 80 words; merge with the previous one)." },
  },
  required: ["title", "summary", "topics", "facts", "mistakes", "vocabulary", "nextTime", "learnerSummary"],
};

const clip = (s: unknown, n: number) => (typeof s === "string" ? s.trim().slice(0, n) : "");
const list = (v: unknown, n: number, each: number) =>
  (Array.isArray(v) ? v : []).map((x) => clip(x, each)).filter(Boolean).slice(0, n);

async function textCall<T>(userId: string, prompt: string, schema: object | null, maxOutputTokens: number): Promise<T> {
  const { result } = await withTextModel(userId, env.geminiTextModel(), async (apiKey, model) => {
    const ai = new GoogleGenAI({ apiKey, httpOptions: { timeout: TEXT_CALL_TIMEOUT_MS } });
    const res = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: schema
        ? { responseMimeType: "application/json", responseSchema: schema, temperature: 0.2, maxOutputTokens }
        : { temperature: 0.2, maxOutputTokens },
    });
    return (schema ? parseModelJson<T>(res) : ((res.text ?? "") as T));
  });
  return result;
}

// Split the transcript into chunks of whole lines (never mid-line).
export function chunkLines(lines: { id: number; text: string }[], maxChars = CHUNK_CHARS) {
  const chunks: { first: number; last: number; text: string }[] = [];
  let cur: string[] = [];
  let first = 0;
  let last = 0;
  let size = 0;
  for (const l of lines) {
    if (cur.length && size + l.text.length + 1 > maxChars) {
      chunks.push({ first, last, text: cur.join("\n") });
      cur = [];
      size = 0;
    }
    if (!cur.length) first = l.id;
    cur.push(l.text);
    last = l.id;
    size += l.text.length + 1;
  }
  if (cur.length) chunks.push({ first, last, text: cur.join("\n") });
  return chunks;
}

// Take the conversation for digestion; false if another server has it, it's
// done, still live, or has failed too often.
async function claim(sessionId: string): Promise<{ user_id: string; started_at: string } | null> {
  const { data: s } = await db()
    .from("chat_sessions")
    .select("user_id, status, started_at, digested_at, digest_started_at, digest_attempts")
    .eq("id", sessionId)
    .maybeSingle();
  if (!s || s.status === "active" || s.digested_at || (s.digest_attempts ?? 0) >= MAX_ATTEMPTS) return null;
  if (s.digest_started_at && Date.now() - new Date(s.digest_started_at).getTime() < CLAIM_STALE_MS) return null;
  let q = db()
    .from("chat_sessions")
    .update({ digest_started_at: new Date().toISOString(), digest_attempts: (s.digest_attempts ?? 0) + 1 })
    .eq("id", sessionId)
    .eq("digest_attempts", s.digest_attempts ?? 0)
    .is("digested_at", null);
  q = s.digest_started_at ? q.eq("digest_started_at", s.digest_started_at) : q.is("digest_started_at", null);
  const { data } = await q.select("id");
  return data?.length ? { user_id: s.user_id as string, started_at: s.started_at as string } : null;
}

/** Digest one finished conversation and fold it into the learner's memory. */
export async function compileSessionMemory(userId: string, sessionId: string): Promise<void> {
  const claimed = await claim(sessionId);
  if (!claimed || claimed.user_id !== userId) return;

  const { data: msgs } = await db()
    .from("chat_messages")
    .select("id, role, body")
    .eq("session_id", sessionId)
    .order("id")
    .limit(2000);
  const rows = (msgs ?? []) as { id: number; role: string; body: string }[];
  const learnerWords = rows.filter((m) => m.role === "user").reduce((n, m) => n + String(m.body).split(/\s+/).filter(Boolean).length, 0);

  // Too little to remember (a hello and a hang-up): mark done, no digest.
  if (rows.filter((m) => m.role === "user").length < 2 || learnerWords < 8) {
    await db()
      .from("chat_sessions")
      .update({ digested_at: new Date().toISOString(), memory_compiled: true, turns: rows.length })
      .eq("id", sessionId);
    return;
  }

  const lines = rows.map((m) => ({
    id: m.id,
    text: `${m.role === "user" ? "Learner" : "K.AI"}: ${String(m.body).slice(0, MAX_LINE_CHARS)}`,
  }));
  let chunks = chunkLines(lines);
  if (chunks.length > MAX_CHUNKS) chunks = chunks.slice(-MAX_CHUNKS); // keep the most recent part

  const { data: existing } = await db().from("learner_memory").select("*").eq("user_id", userId).maybeSingle();

  // Map: summarise each chunk of a long conversation; one chunk goes straight in.
  let material: string;
  if (chunks.length === 1) {
    material = `Transcript:\n${chunks[0].text}`;
  } else {
    const notes = await Promise.all(
      chunks.map((c, i) =>
        textCall<{ notes?: string }>(
          userId,
          `Part ${i + 1} of ${chunks.length} of one spoken English practice conversation between a learner and K.AI (their tutor). ${TRANSCRIPT_NOTE}
Write dense notes: what was discussed, what the learner said about themselves, the learner's mistakes (wrong → right), new words. ${NO_SECRETS}

${c.text}`,
          CHUNK_SCHEMA,
          600,
        ).then((r) => clip(r.notes, 1200)),
      ),
    );
    await db()
      .from("chat_session_chunks")
      .upsert(chunks.map((c, i) => ({ session_id: sessionId, idx: i, first_message_id: c.first, last_message_id: c.last, summary: notes[i] })));
    material = notes.map((n, i) => `Notes on part ${i + 1}:\n${n}`).join("\n\n");
  }

  // Reduce: one digest for the whole conversation (+ the running learner summary).
  const raw = await textCall<Record<string, unknown>>(
    userId,
    `Digest this spoken English practice conversation between a learner and K.AI (their tutor). ${TRANSCRIPT_NOTE} ${NO_SECRETS}

Previous running summary of the learner: ${existing?.summary || "(none)"}

${material}`,
    DIGEST_SCHEMA,
    1500,
  );
  const digest: SessionDigest = {
    title: clip(raw.title, 60).replace(/^["']|["']$/g, "") || "Conversation",
    summary: clip(raw.summary, 400),
    topics: list(raw.topics, 5, 40),
    facts: list(raw.facts, 6, 140),
    mistakes: (Array.isArray(raw.mistakes) ? raw.mistakes : [])
      .map((m: { wrong?: string; correct?: string; why?: string }) => ({ wrong: clip(m?.wrong, 160), correct: clip(m?.correct, 160), why: clip(m?.why, 80) }))
      .filter((m) => m.wrong && m.correct)
      .slice(0, 6),
    vocabulary: (Array.isArray(raw.vocabulary) ? raw.vocabulary : [])
      .map((v: { word?: string; meaning?: string }) => ({ word: clip(v?.word, 60), meaning: clip(v?.meaning, 120) }))
      .filter((v) => v.word)
      .slice(0, 6),
    nextTime: clip(raw.nextTime, 160),
  };
  const learnerSummary = clip(raw.learnerSummary, 800) || existing?.summary || "";

  await db()
    .from("chat_sessions")
    .update({
      title: digest.title,
      summary: digest.summary,
      digest,
      digested_at: new Date().toISOString(),
      memory_compiled: true,
      turns: rows.length,
    })
    .eq("id", sessionId);

  // Fold the digest into the learner's memory. Two conversations can finish at
  // the same moment (an /end and a catch-up), so the write is optimistic: it
  // only lands if learner_memory hasn't changed since we read it; otherwise
  // re-read and merge again (a lost update would silently drop a whole chat).
  const { data: prof } = await db().from("profiles").select("*").eq("id", userId).maybeSingle();
  const profile = prof as ProfileRow | null;
  const pro = !!profile && (isProRow(profile) || isAdminEmail(profile.email));

  let current = existing;
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) {
      const { data } = await db().from("learner_memory").select("*").eq("user_id", userId).maybeSingle();
      current = data;
    }
    const row = await mergedMemory(userId, current, digest, learnerSummary, {
      pro,
      when: claimed.started_at,
      sessionId,
      learnerName: profile?.name ?? "",
    });
    if (!current) {
      const { data: inserted } = await db().from("learner_memory").upsert(row, { onConflict: "user_id", ignoreDuplicates: true }).select("user_id");
      if (inserted?.length) return;
    } else {
      const { data: updated } = await db()
        .from("learner_memory")
        .update(row)
        .eq("user_id", userId)
        .eq("updated_at", current.updated_at as string)
        .select("user_id");
      if (updated?.length) return;
    }
  }
  console.warn("[memory] gave up merging after repeated concurrent updates", sessionId);
}

type MemoryRow = Record<string, unknown> | null;

async function mergedMemory(
  userId: string,
  existing: MemoryRow,
  digest: SessionDigest,
  learnerSummary: string,
  o: { pro: boolean; when: string; sessionId: string; learnerName: string },
) {
  // Structured memory (everyone): recurring mistakes + words, as before.
  const now = new Date().toISOString();
  const mistakes = (((existing?.mistakes as Mistake[]) ?? []).slice(0, 20)).map((m) => ({ ...m }));
  for (const m of digest.mistakes) {
    const hit = mistakes.find((x) => x.correct.toLowerCase() === m.correct.toLowerCase());
    if (hit) {
      hit.count += 1;
      hit.lastSeen = now;
      hit.wrong = m.wrong;
    } else mistakes.push({ wrong: m.wrong, correct: m.correct, why: m.why, count: 1, lastSeen: now });
  }
  mistakes.sort((a, b) => b.count - a.count || b.lastSeen.localeCompare(a.lastSeen));
  const vocab = ((existing?.vocabulary as Vocab[]) ?? []).slice(0, 30).map((v) => ({ ...v }));
  for (const v of digest.vocabulary) {
    const hit = vocab.find((x) => x.word.toLowerCase() === v.word.toLowerCase());
    if (hit) hit.lastSeen = now;
    else vocab.unshift({ word: v.word, meaning: v.meaning, lastSeen: now });
  }

  // Memory file (Pro): compact the old file + this digest into a new one.
  let memoryMd: string | undefined;
  if (o.pro) {
    memoryMd = await compactMemoryFile(userId, {
      previous: (existing?.memory_md as string) ?? "",
      previousUpdatedAt: (existing?.memory_md_updated_at as string | null) ?? null,
      digest,
      when: o.when,
      sessionId: o.sessionId,
      learnerName: o.learnerName,
    }).catch((err) => {
      console.warn("[memory] compaction failed, keeping the previous file:", (err as Error)?.message?.slice(0, 160));
      return undefined;
    });
  }

  return {
    user_id: userId,
    summary: (learnerSummary || (existing?.summary as string) || "").slice(0, 800),
    mistakes: mistakes.slice(0, 20),
    vocabulary: vocab.slice(0, 30),
    sessions: ((existing?.sessions as number) ?? 0) + 1,
    ...(memoryMd !== undefined
      ? {
          memory_md: memoryMd,
          memory_md_updated_at: new Date().toISOString(),
          memory_md_sessions: ((existing?.memory_md_sessions as number) ?? 0) + 1,
        }
      : {}),
  };
}

const MEMORY_SECTIONS = `## About them
## Goals & plans
## What we've talked about
## Mistakes to keep an eye on
## Words they've learnt
## Next time`;

async function compactMemoryFile(
  userId: string,
  a: { previous: string; previousUpdatedAt: string | null; digest: SessionDigest; when: string; sessionId: string; learnerName: string },
): Promise<string> {
  // A learner who just became Pro (no file yet, never cleared): seed the file
  // from their last few digests so K.AI doesn't start from zero.
  let earlier = "";
  if (!a.previous && !a.previousUpdatedAt) {
    const { data } = await db()
      .from("chat_sessions")
      .select("started_at, digest")
      .eq("user_id", userId)
      .neq("id", a.sessionId)
      .not("digest", "is", null)
      .order("started_at", { ascending: false })
      .limit(5);
    earlier = (data ?? [])
      .map((s) => `- ${String(s.started_at).slice(0, 10)}: ${JSON.stringify(s.digest).slice(0, 900)}`)
      .join("\n");
  }
  // (A cleared file has previousUpdatedAt set, so it is NOT re-seeded from old chats.)

  const md = await textCall<string>(
    userId,
    `You are K.AI, a spoken-English tutor. You keep a private Markdown memory file about ONE learner${a.learnerName ? ` (${a.learnerName})` : ""} so you remember them between voice conversations. Update it with the newest conversation.

Rules:
- Output ONLY the Markdown file, using exactly these sections in this order:
${MEMORY_SECTIONS}
- Under 350 words in total. Short bullet points. Merge duplicates, keep what's still true, drop what's stale.
- "What we've talked about": most recent first, one line each as "YYYY-MM-DD — topic: one detail", at most 8 lines.
- "Mistakes to keep an eye on": recurring patterns as "wrong → right", most frequent first, at most 6.
- "Words they've learnt": at most 12, comma-separated on one or two lines.
- "Next time": 1–3 concrete follow-ups (their plans to ask about, a mistake to re-check, a topic to try).
- Only facts from the material below — never invent. ${NO_SECRETS}

Current memory file:
${a.previous || "(empty — this is the first entry)"}
${earlier ? `\nEarlier conversation digests (from before this file existed):\n${earlier}\n` : ""}
Newest conversation (${a.when.slice(0, 10)}):
${JSON.stringify(a.digest)}`,
    null,
    1200,
  );
  const clean = md.replace(/^```(?:markdown|md)?\s*/i, "").replace(/```\s*$/, "").trim();
  if (!clean.includes("##")) throw new Error("memory file without sections");
  return clean.slice(0, MEMORY_MD_MAX);
}

/** Catch-up: digest a few finished conversations that never got one (tab closed, server busy). */
export async function digestPendingSessions(userId: string, max = 2): Promise<void> {
  const { data } = await db()
    .from("chat_sessions")
    .select("id")
    .eq("user_id", userId)
    .neq("status", "active")
    .is("digested_at", null)
    .lt("digest_attempts", MAX_ATTEMPTS)
    .order("started_at", { ascending: false })
    .limit(max);
  for (const s of data ?? []) {
    try {
      await compileSessionMemory(userId, s.id as string);
    } catch (err) {
      console.warn("[memory] catch-up digest failed:", (err as Error)?.message?.slice(0, 160));
    }
  }
}
