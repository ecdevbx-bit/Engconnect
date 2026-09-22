-- ════════════════════════════════════════════════════════════════════
-- Learning content + per-learner practice records:
--   problems                — Jumble sentences & Pronunciation phrases
--   jumble_solves           — idempotency ledger for XP on Jumble
--   pronunciation_attempts  — scored recordings (audio lives in R2)
--   word_bank               — learner's saved words
-- ════════════════════════════════════════════════════════════════════

-- One table for both games (mirrors the old admin "Problems" editor).
--   jumble        : final = correct sentence; initial = optional hand-made
--                   scramble ("" ⇒ server shuffles `final` at serve time)
--   pronunciation : final = the sentence to read; initial = ""
-- Progressive (jumble only): a base sentence and its escalating variants,
-- e.g. base 3 → v1 "The dog barks." v2 "The dog barks at night." …
create table public.problems (
  id          bigint generated always as identity primary key,
  category    text not null check (category in ('jumble', 'pronunciation')),
  difficulty  text not null check (difficulty in ('easy', 'medium', 'hard', 'progressive')),
  -- display/serve order inside (category, difficulty); minted by the server
  sort_order  int not null,
  base        int,
  variant     int,
  initial     text not null default '',
  final       text not null check (length(trim(final)) > 0),
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint problems_progressive_shape check (
    (difficulty = 'progressive' and category = 'jumble' and base is not null and variant is not null)
    or (difficulty <> 'progressive' and base is null and variant is null)
  )
);

create unique index problems_order_key on public.problems (category, difficulty, sort_order);
create unique index problems_progressive_key on public.problems (category, base, variant)
  where difficulty = 'progressive';

create trigger problems_updated_at before update on public.problems
  for each row execute function public.set_updated_at();

alter table public.problems enable row level security;
-- No public read: the browser must never see `final` (it's the answer).

-- XP for a given problem is paid at most once per learner per IST day, so a
-- replayed submit (or looping the last pronunciation slot) can't farm XP.
create table public.problem_rewards (
  user_id     uuid not null references auth.users (id) on delete cascade,
  problem_id  bigint not null references public.problems (id) on delete cascade,
  day         date not null default public.ist_today(),
  xp          int not null default 0,
  created_at  timestamptz not null default now(),
  primary key (user_id, problem_id, day)
);

alter table public.problem_rewards enable row level security;

-- ── pronunciation attempts ─────────────────────────────────────────

create table public.pronunciation_attempts (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  problem_id        bigint references public.problems (id) on delete set null,
  problem_order     int not null,
  difficulty        text not null,
  expected_text     text not null,
  transcript        text not null default '',
  accuracy          real not null default 0,
  accuracy_percent  int not null default 0,
  tier              text not null,
  feedback_tier     text not null,
  message           text not null default '',
  words             jsonb not null default '[]'::jsonb,
  duration_ms       int not null default 0,
  xp_earned         int not null default 0,
  -- R2 object key of the learner's recording ("" when R2 isn't configured)
  audio_key         text not null default '',
  audio_mime        text not null default '',
  scorer            text not null default '',   -- which model scored it
  created_at        timestamptz not null default now()
);

create index pronunciation_attempts_user_idx on public.pronunciation_attempts (user_id, created_at desc);

alter table public.pronunciation_attempts enable row level security;
create policy "read own attempts" on public.pronunciation_attempts
  for select to authenticated using (user_id = auth.uid());

-- ── word bank ──────────────────────────────────────────────────────

create table public.word_bank (
  user_id     uuid not null references auth.users (id) on delete cascade,
  word        text not null check (word ~ '^[a-z][a-z''-]*$'),
  source      text not null default 'manual' check (source in ('manual', 'pronunciation')),
  created_at  timestamptz not null default now(),
  primary key (user_id, word)
);

alter table public.word_bank enable row level security;
create policy "read own words" on public.word_bank
  for select to authenticated using (user_id = auth.uid());
