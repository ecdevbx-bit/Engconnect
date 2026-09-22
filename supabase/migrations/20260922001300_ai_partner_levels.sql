-- AI Partner levels + per-session material (DECISIONS D-032).
-- Levels are now Beginner / Intermediate / Expert ("Advanced" was renamed).
-- material_seed picks the session's material (IELTS cue card, interview
-- questions, role-play scenes…) from the bank in server/gemini/instructions/
-- modes.ts; stored so a reconnect rebuilds exactly the same prompt.
alter table public.chat_sessions add column if not exists material_seed integer not null default 1;
update public.chat_sessions set level = 'Expert' where level = 'Advanced';
