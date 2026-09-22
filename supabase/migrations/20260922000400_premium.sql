-- ════════════════════════════════════════════════════════════════════
-- Premium ("Pro") access: free Pro-trial program, the /pro invite link,
-- learner feedback, and Razorpay subscriptions (wired later — see STATUS.md).
-- The single source of truth for "is this learner Pro right now" is
-- profiles.premium_until > now(); everything here only ever pushes it forward.
-- ════════════════════════════════════════════════════════════════════

create table public.pro_trial_applications (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  phone         text not null default '',
  status        text not null default 'pending' check (status in ('pending', 'approved', 'cancelled')),
  applied_at    timestamptz not null default now(),
  approved_at   timestamptz,
  expires_at    timestamptz,
  days_claimed  int not null default 0
);

alter table public.pro_trial_applications enable row level security;
create policy "read own trial" on public.pro_trial_applications
  for select to authenticated using (user_id = auth.uid());

create table public.feedback (
  id          bigint generated always as identity primary key,
  user_id     uuid references auth.users (id) on delete set null,
  text        text not null check (length(text) between 1 and 5000),
  day         date not null default public.ist_today(),
  created_at  timestamptz not null default now()
);

create index feedback_user_idx on public.feedback (user_id, created_at desc);

alter table public.feedback enable row level security;

create table public.pro_invite_signups (
  user_id        uuid primary key references auth.users (id) on delete cascade,
  granted_at     timestamptz not null default now(),
  premium_until  timestamptz not null
);

alter table public.pro_invite_signups enable row level security;

create table public.subscriptions (
  id                 text primary key,               -- Razorpay subscription/order id
  user_id            uuid not null references auth.users (id) on delete cascade,
  plan_id            text not null,
  status             text not null,
  current_end        timestamptz,
  raw                jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index subscriptions_user_idx on public.subscriptions (user_id);

create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

alter table public.subscriptions enable row level security;
create policy "read own subscriptions" on public.subscriptions
  for select to authenticated using (user_id = auth.uid());
