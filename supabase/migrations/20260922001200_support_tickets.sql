-- ════════════════════════════════════════════════════════════════════
-- Customer support tickets ("Something wrong?" panel). Every ticket is
-- stored here AND emailed to the team via Resend (SUPPORT_EMAIL_TO).
-- Admin inbox: /v3/admin/support. See DECISIONS.md D-029.
-- ════════════════════════════════════════════════════════════════════

create table public.support_tickets (
  id          bigint generated always as identity primary key,
  user_id     uuid references auth.users (id) on delete set null,
  email       text not null default '',
  name        text not null default '',
  category    text not null,
  message     text not null check (length(message) between 1 and 4000),
  page        text not null default '',
  user_agent  text not null default '',
  ip_hash     text not null default '',
  status      text not null default 'open' check (status in ('open', 'resolved')),
  emailed     boolean not null default false,
  email_error text,
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);

create index support_tickets_status_idx on public.support_tickets (status, created_at desc);
create index support_tickets_user_idx on public.support_tickets (user_id, created_at desc);
create index support_tickets_ip_idx on public.support_tickets (ip_hash, created_at desc);

alter table public.support_tickets enable row level security;
create policy "read own tickets" on public.support_tickets
  for select to authenticated using (user_id = auth.uid());
