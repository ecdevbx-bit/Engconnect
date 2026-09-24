-- Guards found by the 2026-09-24 code audit (DECISIONS D-045).

-- A learner's browser may report "the key failed" a couple of times per K.AI
-- session; more reports are ignored so no one can take shared keys out of
-- rotation by repeating the request.
alter table public.chat_sessions add column if not exists key_reports int not null default 0;

-- One live K.AI conversation per learner, enforced by the database (two tabs
-- starting at the same moment could both pass the app's check). Close older
-- duplicates first so the index can be built.
update public.chat_sessions c
   set status = 'ended', ended_at = now(), end_reason = 'duplicate'
 where c.status = 'active'
   and c.id not in (
     select distinct on (user_id) id
       from public.chat_sessions
      where status = 'active'
      order by user_id, started_at desc
   );
create unique index if not exists chat_sessions_one_active_per_user
  on public.chat_sessions (user_id) where status = 'active';
