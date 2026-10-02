-- K.AI memory robustness (DECISIONS D-047 follow-up, 2026-10-02).
-- A chat could be digested but never folded into the learner's memory file (the
-- compaction call failed, or the server stopped between the two steps) — and
-- nothing retried it, because "digested" was the only marker. memory_merged_at
-- records the second step; the catch-up retries chats where it is still empty.

alter table public.chat_sessions
  add column if not exists memory_merged_at timestamptz;

-- Everything already digested (or skipped as too short) counts as merged.
update public.chat_sessions
   set memory_merged_at = digested_at
 where digested_at is not null and memory_merged_at is null;

drop index if exists public.chat_sessions_undigested_idx;
create index if not exists chat_sessions_unmerged_idx
  on public.chat_sessions (user_id, started_at desc)
  where memory_merged_at is null and status <> 'active';
