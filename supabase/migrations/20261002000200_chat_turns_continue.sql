-- K.AI history extras (DECISIONS D-047).
-- turns: saved transcript lines per conversation, kept by the progress heartbeat so
-- the history list never has to count chat_messages.
-- continued_from: a session started with "Continue this conversation" points at the
-- conversation it continues (its digest + last lines go into the new prompt).

alter table public.chat_sessions
  add column if not exists turns int not null default 0,
  add column if not exists continued_from uuid references public.chat_sessions (id) on delete set null;

update public.chat_sessions s
   set turns = (select count(*) from public.chat_messages m where m.session_id = s.id)
 where s.turns = 0;
