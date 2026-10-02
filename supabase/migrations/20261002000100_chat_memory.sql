-- K.AI chat history + compacted memory (DECISIONS D-047).
--
-- Layers (Karpathy "LLM OS" memory, all in Postgres — no Redis):
--   chat_messages            raw transcript (already exists)
--   chat_session_chunks      long conversations split into chunks, each summarised
--   chat_sessions.digest     one digest per conversation (title, summary, topics,
--                            facts, corrections, words, next-time tip)
--   learner_memory.memory_md one compacted Markdown "memory file" per learner (Pro),
--                            re-written after each conversation and sent to Gemini
--                            in the next session's locked system prompt.

alter table public.chat_sessions
  add column if not exists title             text not null default '',
  add column if not exists summary           text not null default '',
  add column if not exists digest            jsonb,
  add column if not exists digested_at       timestamptz,
  -- claim marker so two servers never digest the same conversation at once
  add column if not exists digest_started_at timestamptz,
  add column if not exists digest_attempts   int not null default 0;

-- Conversations still waiting for a digest (catch-up after tabs that vanished).
create index if not exists chat_sessions_undigested_idx
  on public.chat_sessions (user_id, started_at desc)
  where digested_at is null and status <> 'active';

create table if not exists public.chat_session_chunks (
  session_id        uuid not null references public.chat_sessions (id) on delete cascade,
  idx               int not null,
  first_message_id  bigint not null,
  last_message_id   bigint not null,
  summary           text not null,
  created_at        timestamptz not null default now(),
  primary key (session_id, idx)
);
alter table public.chat_session_chunks enable row level security;
-- No policies: server (service role) only.

alter table public.learner_memory
  add column if not exists memory_md            text not null default '',
  add column if not exists memory_md_updated_at timestamptz,
  add column if not exists memory_md_sessions   int not null default 0;
