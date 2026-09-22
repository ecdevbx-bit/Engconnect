-- AI Partner session options (language already stored; voice + level existed).
-- `scenario` = role-play mode picked on the start card (see
-- frontend/src/lib/aiPartnerOptions.ts). Reconnects reuse it so K.AI stays in mode.
alter table public.chat_sessions
  add column if not exists scenario text not null default 'General Conversation';
