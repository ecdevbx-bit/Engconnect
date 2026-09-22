-- ════════════════════════════════════════════════════════════════════
-- Foundation: learner profiles, progress attributes, admin-editable
-- settings, feature flags, level catalog, badge catalog.
--
-- Access model (see docs/memory/DECISIONS.md D-002):
--   * The Next.js server talks to Postgres with the service-role key and
--     enforces all business rules. That role bypasses RLS.
--   * RLS is still ON everywhere, with read-only "own rows" policies, so the
--     publishable key in the browser can never read someone else's data or
--     write anything directly.
-- ════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ── shared helpers ──────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- India is the primary market: daily streaks and Pro daily caps roll over
-- at midnight IST. (Gemini quotas use Pacific time — see the key pool.)
create or replace function public.ist_today()
returns date
language sql
stable
as $$
  select (now() at time zone 'Asia/Kolkata')::date;
$$;

-- ── profiles (1:1 with auth.users) ─────────────────────────────────
-- Field names mirror the old backend's ecaiUser so the frontend types
-- (EcaiUser / V3MeProfile) map 1:1.

create table public.profiles (
  id                    uuid primary key references auth.users (id) on delete cascade,
  email                 text not null default '',
  name                  text not null default '',
  phone                 text not null default '',
  location              text not null default '',
  native_lang           text not null default '',
  current_status        text not null default '',
  english_reason        text not null default '',
  goals                 text not null default '',
  hobbies               text not null default '',
  -- "<style>:<seed>" — rendered by DiceBear on the client
  avatar                text not null default '',
  onboarding_completed  boolean not null default false,
  -- Entitlement cursor. Pro ⇔ premium_until > now().
  premium_until         timestamptz,
  -- Single-active-session: the id issued at the latest login. Requests that
  -- carry a different X-Session-Id get SESSION_SUPERSEDED.
  active_session_id     text,
  -- Per-account early access to AI Partner while the global flag is off.
  ai_partner_access     boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
create policy "read own profile" on public.profiles
  for select to authenticated using (id = auth.uid());

-- ── user_attributes: the hot progress row ──────────────────────────

create table public.user_attributes (
  user_id           uuid primary key references auth.users (id) on delete cascade,
  xp                int not null default 0 check (xp >= 0),
  current_level     int not null default 1,
  -- consecutive IST days with at least one XP-earning action
  activity_streak   int not null default 0,
  best_streak       int not null default 0,
  last_active_day   date,
  -- per-game consecutive-correct counters: {"jumble": 3, "pronunciation": 1}
  combos            jsonb not null default '{}'::jsonb,
  -- per-(game:difficulty) content cursors: {"jumble:easy": 12}
  cursors           jsonb not null default '{}'::jsonb,
  progressive_sets  int not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger user_attributes_updated_at before update on public.user_attributes
  for each row execute function public.set_updated_at();

alter table public.user_attributes enable row level security;
create policy "read own attributes" on public.user_attributes
  for select to authenticated using (user_id = auth.uid());

-- Leaderboard ordering.
create index user_attributes_xp_idx on public.user_attributes (xp desc);
create index user_attributes_streak_idx on public.user_attributes (activity_streak desc);

-- ── new auth user ⇒ profile + attributes ───────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, avatar)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    ''
  )
  on conflict (id) do nothing;

  insert into public.user_attributes (user_id) values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── app_settings: admin-editable JSON documents ────────────────────
-- One row per settings document (jumble, pronunciation_timings,
-- ai_partner_rewards, quotas, pro_trial, pro_invite, ai_partner_live).
-- Defaults live in code; a missing row means "use defaults".

create table public.app_settings (
  key         text primary key,
  value       jsonb not null,
  updated_by  text,
  updated_at  timestamptz not null default now()
);

create trigger app_settings_updated_at before update on public.app_settings
  for each row execute function public.set_updated_at();

alter table public.app_settings enable row level security;

-- ── feature_flags ──────────────────────────────────────────────────

create table public.feature_flags (
  key          text primary key,
  enabled      boolean not null default false,
  description  text not null default '',
  updated_at   timestamptz not null default now()
);

create trigger feature_flags_updated_at before update on public.feature_flags
  for each row execute function public.set_updated_at();

alter table public.feature_flags enable row level security;
create policy "flags are public" on public.feature_flags
  for select to anon, authenticated using (true);

-- ── levels (admin-editable catalog) ────────────────────────────────

create table public.levels (
  level      int primary key check (level >= 1),
  threshold  int not null check (threshold >= 0),
  title      text not null,
  icon       text not null
);

alter table public.levels enable row level security;
create policy "levels are public" on public.levels
  for select to anon, authenticated using (true);

-- ── badges catalog + earned badges ─────────────────────────────────
-- Badge ids are derived: xp:<n>, lvl:<n>, streak:<n>, combo:<game>:<n>,
-- progset:<n>, onboarding:1. Visuals live in the frontend registry.

create table public.badges (
  id          text primary key,
  category    text not null check (category in ('xp', 'lvl', 'streak', 'combo', 'progset', 'onboarding')),
  game        text check (game is null or game in ('jumble', 'pronunciation', 'ai-partner')),
  threshold   int not null check (threshold >= 0),
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger badges_updated_at before update on public.badges
  for each row execute function public.set_updated_at();

alter table public.badges enable row level security;
create policy "badges are public" on public.badges
  for select to anon, authenticated using (true);

create table public.user_badges (
  user_id    uuid not null references auth.users (id) on delete cascade,
  badge_id   text not null,
  earned_at  timestamptz not null default now(),
  primary key (user_id, badge_id)
);

alter table public.user_badges enable row level security;
create policy "read own badges" on public.user_badges
  for select to authenticated using (user_id = auth.uid());

-- ── activity log (XP-earning events) ───────────────────────────────

create table public.activity (
  id             bigint generated always as identity primary key,
  user_id        uuid not null references auth.users (id) on delete cascade,
  category       text not null,          -- jumble | pronunciation | ai-partner
  difficulty     text not null default '',
  problem_order  int not null default 0,
  xp_earned      int not null default 0,
  created_at     timestamptz not null default now()
);

create index activity_user_time_idx on public.activity (user_id, created_at desc);
-- weekly leaderboard scans a week of rows
create index activity_time_idx on public.activity (created_at desc);

alter table public.activity enable row level security;
create policy "read own activity" on public.activity
  for select to authenticated using (user_id = auth.uid());

-- ── daily usage counters (free-tier quotas) ────────────────────────

create table public.daily_usage (
  user_id  uuid not null references auth.users (id) on delete cascade,
  day      date not null,
  bucket   text not null,                -- e.g. "jumble:easy", "pronunciation:hard"
  used     int not null default 0,
  primary key (user_id, day, bucket)
);

alter table public.daily_usage enable row level security;

-- Atomically add `amount` to a counter unless it would exceed `cap`.
-- Returns the new count, or -1 if the cap blocks it. cap <= 0 ⇒ unlimited.
create or replace function public.bump_daily_usage(
  p_user uuid, p_bucket text, p_cap int, p_amount int default 1
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  today date := ist_today();
  current_count int;
begin
  insert into daily_usage (user_id, day, bucket, used)
  values (p_user, today, p_bucket, 0)
  on conflict (user_id, day, bucket) do nothing;

  select d.used into current_count
    from daily_usage d
   where d.user_id = p_user and d.day = today and d.bucket = p_bucket
   for update;

  if p_cap > 0 and current_count + p_amount > p_cap then
    return -1;
  end if;

  update daily_usage set used = used + p_amount
   where user_id = p_user and day = today and bucket = p_bucket;
  return current_count + p_amount;
end;
$$;

revoke execute on function public.bump_daily_usage(uuid, text, int, int) from public, anon, authenticated;
