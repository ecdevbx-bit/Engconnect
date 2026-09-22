-- ════════════════════════════════════════════════════════════════════
-- AI Partner (K.AI) on Gemini Live.
--   chat_sessions   — one row per conversation; time-cap accounting + XP
--   chat_messages   — transcript (from Gemini input/output transcription)
--   learner_memory  — what K.AI remembers about a learner between sessions
-- See DECISIONS.md D-004 / D-007.
-- ════════════════════════════════════════════════════════════════════

create table public.chat_sessions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  language            text not null default 'English',
  level               text not null default '',
  voice               text not null default '',
  model               text not null default '',
  -- current Gemini key lease (changes if we fail over to another key)
  lease_id            uuid,
  status              text not null default 'active' check (status in ('active', 'ended', 'failed')),
  started_at          timestamptz not null default now(),
  last_heartbeat_at   timestamptz not null default now(),
  ended_at            timestamptz,
  -- wall-clock seconds charged against the learner's daily/weekly cap
  billed_seconds      int not null default 0,
  -- learner talk-time (tap-to-talk recording time), clamped server-side
  speaking_seconds    int not null default 0,
  -- words the learner actually said (from Gemini's input transcription);
  -- talk-time credit is capped by it, so tapping the mic silently earns nothing
  user_words          int not null default 0,
  milestones_awarded  int not null default 0,
  xp_awarded          int not null default 0,
  prompt_tokens       int not null default 0,
  response_tokens     int not null default 0,
  end_reason          text not null default '',
  memory_compiled     boolean not null default false
);

create index chat_sessions_user_time_idx on public.chat_sessions (user_id, started_at desc);
create index chat_sessions_active_idx on public.chat_sessions (status) where status = 'active';

alter table public.chat_sessions enable row level security;
create policy "read own chat sessions" on public.chat_sessions
  for select to authenticated using (user_id = auth.uid());

create table public.chat_messages (
  id          bigint generated always as identity primary key,
  session_id  uuid not null references public.chat_sessions (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  role        text not null check (role in ('user', 'assistant')),
  body        text not null,
  created_at  timestamptz not null default now()
);

create index chat_messages_session_idx on public.chat_messages (session_id, id);

alter table public.chat_messages enable row level security;
create policy "read own chat messages" on public.chat_messages
  for select to authenticated using (user_id = auth.uid());

-- Long-term tutor memory, compiled after each session by a cheap Gemini text
-- call (idea carried over from ENGAI's "Karpathy memory"): a short running
-- summary, recurring mistakes, and vocabulary the learner practised. It is
-- injected into the next session's system prompt.
create table public.learner_memory (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  summary      text not null default '',
  -- [{ "wrong": "...", "correct": "...", "why": "...", "count": 2, "lastSeen": "..." }]
  mistakes     jsonb not null default '[]'::jsonb,
  -- [{ "word": "...", "meaning": "...", "lastSeen": "..." }]
  vocabulary   jsonb not null default '[]'::jsonb,
  sessions     int not null default 0,
  updated_at   timestamptz not null default now()
);

create trigger learner_memory_updated_at before update on public.learner_memory
  for each row execute function public.set_updated_at();

alter table public.learner_memory enable row level security;
create policy "read own memory" on public.learner_memory
  for select to authenticated using (user_id = auth.uid());
