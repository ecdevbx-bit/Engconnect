import "server-only";

import { after } from "next/server";

import { getProfile } from "../domain/users";
import { digestPendingSessions, type SessionDigest } from "../gemini/memory";
import { requireUser } from "../guards";
import { fail, int, ok } from "../http";
import type { Router } from "../router";
import { db, must } from "../supabase";
import { memoryPro } from "./chat";

// K.AI chat history + memory (D-047) — the ChatGPT-style "previous chats" list,
// one conversation's transcript + digest, and the memory file K.AI keeps.
// History and the memory file are Pro; deleting your own chats or clearing
// your memory is allowed for everyone (it's their data).
// Client contract: src/lib/v3ChatHistory.ts.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Row = {
  id: string;
  title: string;
  summary: string;
  started_at: string;
  ended_at: string | null;
  billed_seconds: number;
  turns: number;
  scenario: string;
  language: string;
  level: string;
  status: string;
  digest: SessionDigest | null;
  digested_at: string | null;
  digest_attempts: number;
};

const COLS = "id, title, summary, started_at, ended_at, billed_seconds, turns, scenario, language, level, status, digest, digested_at, digest_attempts";

function item(r: Row) {
  return {
    id: r.id,
    title: r.title ?? "",
    summary: r.summary ?? "",
    startedAt: r.started_at,
    endedAt: r.ended_at,
    minutes: Math.round(((r.billed_seconds ?? 0) / 60) * 10) / 10,
    turns: r.turns ?? 0,
    mode: r.scenario || "General Conversation",
    language: r.language || "English",
    level: r.level || "",
    status: r.status === "active" ? ("active" as const) : ("ended" as const),
    // ready = digest written · skipped = too short to remember (or gave up) · pending = on its way
    digest: r.digest ? ("ready" as const) : r.digested_at || (r.digest_attempts ?? 0) >= 3 ? ("skipped" as const) : ("pending" as const),
  };
}

async function ownSession(userId: string, id: string): Promise<Row> {
  if (!UUID_RE.test(id)) throw fail.notFound("Conversation not found.");
  const row = must(
    await db().from("chat_sessions").select(COLS).eq("id", id).eq("user_id", userId).maybeSingle(),
    "load conversation",
  ) as Row | null;
  if (!row) throw fail.notFound("Conversation not found.");
  return row;
}

export function registerChatHistoryRoutes(r: Router) {
  r.on("GET", "/chat/history", async ({ req, query }) => {
    const u = await requireUser(req);
    const profile = await getProfile(u.id);
    const limit = int(query.get("limit"), "limit", { min: 1, max: 50, fallback: 30 });

    // Only conversations with something in them (a hello-and-hang-up stays out).
    const { count } = await db()
      .from("chat_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", u.id)
      .gt("turns", 1);
    if (!memoryPro(u, profile)) return ok({ locked: true, total: count ?? 0, sessions: [], nextBefore: null });

    let q = db()
      .from("chat_sessions")
      .select(COLS)
      .eq("user_id", u.id)
      .gt("turns", 1)
      .order("started_at", { ascending: false })
      .limit(limit + 1);
    const before = query.get("before");
    if (before) {
      if (Number.isNaN(Date.parse(before))) throw fail.badRequest("before must be a date.");
      q = q.lt("started_at", before);
    }
    const rows = must(await q, "load history") as Row[];
    const page = rows.slice(0, limit);

    // Some finished chats never got their digest (tab closed) — catch up now.
    if (page.some((x) => !x.digest && !x.digested_at && x.status !== "active" && (x.digest_attempts ?? 0) < 3)) {
      after(async () => {
        try {
          await digestPendingSessions(u.id, 2);
        } catch (err) {
          console.warn("[memory] history catch-up failed:", err instanceof Error ? err.message : err);
        }
      });
    }

    return ok({
      locked: false,
      total: count ?? 0,
      sessions: page.map(item),
      nextBefore: rows.length > limit ? page[page.length - 1].started_at : null,
    });
  });

  r.on("GET", "/chat/history/:id", async ({ req, params }) => {
    const u = await requireUser(req);
    const profile = await getProfile(u.id);
    if (!memoryPro(u, profile)) throw fail.forbidden("Chat history is part of Pro.", "PRO_REQUIRED");
    const row = await ownSession(u.id, params.id);
    const msgs = must(
      await db().from("chat_messages").select("role, body, created_at").eq("session_id", row.id).order("id").limit(2000),
      "load transcript",
    ) as { role: string; body: string; created_at: string }[];
    return ok({
      session: item(row),
      messages: msgs.map((m) => ({ role: m.role === "user" ? "user" : "assistant", text: m.body, at: m.created_at })),
      digest: row.digest
        ? {
            summary: row.digest.summary ?? row.summary ?? "",
            topics: row.digest.topics ?? [],
            facts: row.digest.facts ?? [],
            mistakes: row.digest.mistakes ?? [],
            vocabulary: row.digest.vocabulary ?? [],
            nextTime: row.digest.nextTime ?? "",
          }
        : null,
    });
  });

  // Delete one conversation (transcript, chunks, digest). What K.AI already
  // folded into its memory file stays until the learner clears memory.
  r.on("DELETE", "/chat/history/:id", async ({ req, params }) => {
    const u = await requireUser(req);
    const row = await ownSession(u.id, params.id);
    if (row.status === "active") throw fail.conflict("This conversation is still live — end it first.", "SESSION_ACTIVE");
    must(await db().from("chat_sessions").delete().eq("id", row.id).eq("user_id", u.id).select("id"), "delete conversation");
    return ok({ deleted: true }, "Conversation deleted");
  });

  r.on("GET", "/chat/memory", async ({ req }) => {
    const u = await requireUser(req);
    const profile = await getProfile(u.id);
    const pro = memoryPro(u, profile);
    const { data: mem } = await db().from("learner_memory").select("*").eq("user_id", u.id).maybeSingle();
    return ok({
      pro,
      memoryMd: pro ? ((mem?.memory_md as string | undefined) ?? "") : "",
      updatedAt: pro ? ((mem?.memory_md_updated_at as string | null | undefined) ?? null) : ((mem?.updated_at as string | undefined) ?? null),
      sessions: pro ? ((mem?.memory_md_sessions as number | undefined) ?? 0) : ((mem?.sessions as number | undefined) ?? 0),
      mistakes: ((mem?.mistakes as { wrong: string; correct: string; why?: string; count?: number }[] | undefined) ?? []).slice(0, 12),
      vocabulary: ((mem?.vocabulary as { word: string; meaning?: string }[] | undefined) ?? []).slice(0, 20),
    });
  });

  // Forget everything K.AI learnt about the learner. Chats stay. The cleared
  // timestamp stops the next digest from re-seeding the file from old chats.
  r.on("DELETE", "/chat/memory", async ({ req }) => {
    const u = await requireUser(req);
    must(
      await db()
        .from("learner_memory")
        .upsert({
          user_id: u.id,
          summary: "",
          mistakes: [],
          vocabulary: [],
          sessions: 0,
          memory_md: "",
          memory_md_sessions: 0,
          memory_md_updated_at: new Date().toISOString(),
        })
        .select("user_id"),
      "clear memory",
    );
    return ok({ cleared: true }, "K.AI's memory cleared");
  });
}
