-- Learn library switch + Jumble structure hints (DECISIONS D-042, D-043).

-- Learn library (/learn): OFF = only admins can open it (preview), ON = everyone.
-- Starts OFF so the owner can read the lessons before learners see them.
insert into public.feature_flags (key, enabled, description) values
  ('englishconnection-learn', false, 'Learn library — show to everyone (off = only admins can see it)')
on conflict (key) do nothing;

-- Jumble "structure" hints, generated once per sentence × learner language by
-- the text model and reused by everyone. Never readable by the browser: the
-- clue talks about the answer.
create table if not exists public.problem_hints (
  problem_id  bigint not null references public.problems (id) on delete cascade,
  lang        text not null default 'English',
  data        jsonb not null,
  model       text not null default '',
  created_at  timestamptz not null default now(),
  primary key (problem_id, lang)
);
alter table public.problem_hints enable row level security;

-- How far a learner went into the hints for a sentence today. Seeing the full
-- sentence halves the XP for that sentence (the answer was given away).
create table if not exists public.jumble_hint_uses (
  user_id     uuid not null references auth.users (id) on delete cascade,
  problem_id  bigint not null references public.problems (id) on delete cascade,
  day         date not null default public.ist_today(),
  max_level   int not null default 0,
  updated_at  timestamptz not null default now(),
  primary key (user_id, problem_id, day)
);
alter table public.jumble_hint_uses enable row level security;

-- Record a hint level atomically (keeps the highest level seen today).
create or replace function public.record_jumble_hint(p_user uuid, p_problem bigint, p_level int)
returns int
language sql
security definer
set search_path = public
as $$
  insert into public.jumble_hint_uses (user_id, problem_id, max_level)
  values (p_user, p_problem, p_level)
  on conflict (user_id, problem_id, day)
  do update set max_level = greatest(jumble_hint_uses.max_level, excluded.max_level), updated_at = now()
  returning max_level;
$$;
revoke all on function public.record_jumble_hint(uuid, bigint, int) from public, anon, authenticated;
