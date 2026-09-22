-- ════════════════════════════════════════════════════════════════════
-- Email-sending limits for auth (sign-up confirmation, resend, password
-- reset). Supabase also rate-limits emails itself (rate_limit_email_sent,
-- configured via the Management API once custom SMTP exists); this table
-- adds OUR limits per email address and per IP so one person can't spam an
-- inbox or burn the SMTP quota. See DECISIONS.md D-008 / D-020.
-- ════════════════════════════════════════════════════════════════════

create table public.auth_email_events (
  id          bigint generated always as identity primary key,
  kind        text not null check (kind in ('signup', 'resend', 'reset')),
  email       text not null,
  -- sha256 prefix of the client IP — enough to rate-limit, not to track
  ip_hash     text not null default '',
  allowed     boolean not null,
  created_at  timestamptz not null default now()
);

create index auth_email_events_email_idx on public.auth_email_events (email, created_at desc);
create index auth_email_events_ip_idx on public.auth_email_events (ip_hash, created_at desc);

alter table public.auth_email_events enable row level security;
revoke all on public.auth_email_events from anon, authenticated;

-- Atomic check-and-record. Returns true when the send is allowed.
create or replace function public.auth_email_allow(
  p_kind text, p_email text, p_ip_hash text,
  p_per_email int, p_per_ip int, p_window_minutes int default 60
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  since timestamptz := now() - make_interval(mins => p_window_minutes);
  by_email int;
  by_ip int;
  ok boolean;
begin
  perform pg_advisory_xact_lock(hashtext('auth_email:' || lower(p_email)));
  select count(*) into by_email from auth_email_events
   where email = lower(p_email) and allowed and created_at > since;
  select count(*) into by_ip from auth_email_events
   where p_ip_hash <> '' and ip_hash = p_ip_hash and allowed and created_at > since;
  ok := by_email < p_per_email and (p_ip_hash = '' or by_ip < p_per_ip);
  insert into auth_email_events (kind, email, ip_hash, allowed)
  values (p_kind, lower(p_email), p_ip_hash, ok);
  -- keep the table small
  delete from auth_email_events where created_at < now() - interval '7 days';
  return ok;
end;
$$;

revoke execute on function public.auth_email_allow(text, text, text, int, int, int) from public, anon, authenticated;
