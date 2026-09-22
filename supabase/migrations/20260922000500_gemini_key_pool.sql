-- ════════════════════════════════════════════════════════════════════
-- Gemini API key pool — rotation, cooldown and concurrency leases.
--
-- Why this exists: the AI Partner runs on Gemini Live free tier. We hold
-- several API keys (each from a DIFFERENT Google Cloud project — Google
-- rate-limits per project, not per key) and spread sessions across them.
-- A key that hits its quota is pulled out of rotation until its quota
-- resets, then comes back automatically. See DECISIONS.md D-005/D-006.
--
-- Lanes: Google quotas are per MODEL, so a key can be out of Live quota
-- but still fine for the text/audio model that scores pronunciation.
-- Each key therefore has independent health per lane:
--   live : Gemini Live sessions (AI Partner)
--   text : generateContent calls (pronunciation scoring, memory summaries)
--
-- Security: raw keys live only in gemini_api_keys. RLS is enabled with NO
-- policies and privileges are revoked, so only the service role (the
-- Next.js server) can read them. The browser only ever receives a
-- short-lived Gemini *ephemeral token*, never a key.
-- ════════════════════════════════════════════════════════════════════

create table public.gemini_api_keys (
  id              uuid primary key default gen_random_uuid(),
  label           text not null unique,
  api_key         text not null,
  -- sha256 prefix: dedupes env-seeded keys without comparing secrets
  fingerprint     text not null unique,
  -- admin switch; a disabled key is never leased
  enabled         boolean not null default true,
  -- Google rejected the key (bad/revoked/billing). Affects every lane.
  invalid         boolean not null default false,
  invalid_reason  text,
  -- free : Google free tier — always preferred
  -- paid : billed key — only leased when NO free key can take the request
  tier            text not null default 'free' check (tier in ('free', 'paid')),
  -- max simultaneous Live sessions on this key (free tier is small)
  max_concurrent  int not null default 3 check (max_concurrent between 1 and 100),
  priority        int not null default 100,
  source          text not null default 'admin' check (source in ('admin', 'env')),
  notes           text not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger gemini_api_keys_updated_at before update on public.gemini_api_keys
  for each row execute function public.set_updated_at();

alter table public.gemini_api_keys enable row level security;

create table public.gemini_key_lanes (
  key_id                uuid not null references public.gemini_api_keys (id) on delete cascade,
  lane                  text not null check (lane in ('live', 'text')),
  -- active    : in rotation
  -- cooldown  : short back-off after a per-minute / concurrency limit
  -- exhausted : daily quota used up; returns at the next Pacific midnight
  status                text not null default 'active' check (status in ('active', 'cooldown', 'exhausted')),
  cooldown_until        timestamptz,
  -- counters for the Pacific-time day (when Google resets quotas)
  usage_day             date not null default (now() at time zone 'America/Los_Angeles')::date,
  requests_today        int not null default 0,
  errors_today          int not null default 0,
  seconds_today         int not null default 0,
  requests_total        bigint not null default 0,
  consecutive_failures  int not null default 0,
  last_used_at          timestamptz,
  last_ok_at            timestamptz,
  last_error            text,
  last_error_at         timestamptz,
  primary key (key_id, lane)
);

alter table public.gemini_key_lanes enable row level security;

-- Every key always has both lanes.
create or replace function public.gemini_key_add_lanes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into gemini_key_lanes (key_id, lane) values (new.id, 'live'), (new.id, 'text')
  on conflict do nothing;
  return new;
end;
$$;

create trigger gemini_api_keys_lanes after insert on public.gemini_api_keys
  for each row execute function public.gemini_key_add_lanes();

-- A lease = one use of one key. Live leases last as long as the session and
-- are kept alive by heartbeats; if the tab dies without calling /end the
-- lease simply expires, so a crashed browser never pins a key forever.
create table public.gemini_key_leases (
  id            uuid primary key default gen_random_uuid(),
  key_id        uuid not null references public.gemini_api_keys (id) on delete cascade,
  lane          text not null check (lane in ('live', 'text')),
  user_id       uuid references auth.users (id) on delete set null,
  started_at    timestamptz not null default now(),
  heartbeat_at  timestamptz not null default now(),
  expires_at    timestamptz not null,
  released_at   timestamptz,
  outcome       text,
  detail        text
);

create index gemini_key_leases_open_idx
  on public.gemini_key_leases (key_id, lane)
  where released_at is null;

alter table public.gemini_key_leases enable row level security;

-- Append-only audit trail shown on the admin Keys page.
create table public.gemini_key_events (
  id          bigint generated always as identity primary key,
  key_id      uuid references public.gemini_api_keys (id) on delete cascade,
  lane        text,
  event       text not null,
  detail      text,
  created_at  timestamptz not null default now()
);

create index gemini_key_events_key_idx on public.gemini_key_events (key_id, created_at desc);

alter table public.gemini_key_events enable row level security;

-- ── helpers ─────────────────────────────────────────────────────────

-- Next midnight in Pacific time — when Google's per-day quotas reset.
create or replace function public.next_pacific_midnight()
returns timestamptz
language sql
stable
as $$
  select (((now() at time zone 'America/Los_Angeles')::date + 1)::timestamp
          at time zone 'America/Los_Angeles');
$$;

-- Bring expired cooldowns back into rotation, roll daily counters, and close
-- leases whose browser went away without saying goodbye. Cheap; runs at the
-- start of every lease and on the admin page.
create or replace function public.gemini_refresh_key_states()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  today date := (now() at time zone 'America/Los_Angeles')::date;
begin
  update gemini_key_lanes
     set status = 'active',
         cooldown_until = null,
         consecutive_failures = case when status = 'exhausted' then 0 else consecutive_failures end
   where status in ('cooldown', 'exhausted')
     and cooldown_until is not null
     and cooldown_until <= now();

  update gemini_key_lanes
     set usage_day = today, requests_today = 0, errors_today = 0, seconds_today = 0
   where usage_day <> today;

  update gemini_key_leases
     set released_at = now(), outcome = coalesce(outcome, 'expired')
   where released_at is null
     and expires_at <= now();
end;
$$;

-- Pick the least-loaded healthy key for a lane and open a lease on it.
-- Returns zero rows when every key is busy or out of quota.
-- p_exclude lets the caller skip keys that just failed (fail-over).
create or replace function public.gemini_lease_key(
  p_user_id     uuid,
  p_lane        text default 'live',
  p_ttl_seconds int  default 120,
  p_exclude     uuid[] default '{}'
)
returns table (lease_id uuid, key_id uuid, key_label text, api_key text)
language plpgsql
security definer
set search_path = public
as $$
declare
  k record;
  new_lease uuid;
begin
  -- Leases are taken once per session start / scoring call; a global lock
  -- costs nothing at this volume and makes the capacity check race-free.
  perform pg_advisory_xact_lock(hashtext('gemini_lease_key'));
  perform gemini_refresh_key_states();

  select g.id, g.label, g.api_key
    into k
    from gemini_api_keys g
    join gemini_key_lanes l on l.key_id = g.id and l.lane = p_lane
    left join lateral (
      select count(*) as open_leases
        from gemini_key_leases x
       where x.key_id = g.id and x.lane = p_lane
         and x.released_at is null and x.expires_at > now()
    ) o on true
   where g.enabled
     and not g.invalid
     and l.status = 'active'
     and not (g.id = any (p_exclude))
     -- concurrency matters for Live sockets; text calls are short-lived
     and (p_lane <> 'live' or o.open_leases < g.max_concurrent)
   -- Free keys first, ALWAYS; the paid key is the overflow of last resort.
   order by (g.tier = 'paid') asc, o.open_leases asc, l.requests_today asc, g.priority asc,
            l.last_used_at asc nulls first
   limit 1;

  if not found then
    return;
  end if;

  insert into gemini_key_leases (key_id, lane, user_id, expires_at)
  values (k.id, p_lane, p_user_id, now() + make_interval(secs => p_ttl_seconds))
  returning id into new_lease;

  update gemini_key_lanes
     set last_used_at = now(),
         requests_today = requests_today + 1,
         requests_total = requests_total + 1
   where gemini_key_lanes.key_id = k.id and lane = p_lane;

  return query select new_lease, k.id, k.label, k.api_key;
end;
$$;

-- Keep a Live lease alive while the session runs.
create or replace function public.gemini_heartbeat_lease(p_lease_id uuid, p_ttl_seconds int default 120)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update gemini_key_leases
     set heartbeat_at = now(),
         expires_at = now() + make_interval(secs => p_ttl_seconds)
   where id = p_lease_id and released_at is null;
  return found;
end;
$$;

-- Close a lease and record what happened. The outcome drives lane health:
--   ok            → healthy, reset failure streak
--   quota_daily   → exhausted until next Pacific midnight
--   quota_minute  → cooldown, exponential back-off (1, 2, 4 … 30 min)
--   concurrency   → short cooldown (45 s)
--   invalid       → whole key out of rotation until an admin fixes it
--   error         → counted; 5 in a row triggers a 5 min cooldown
create or replace function public.gemini_release_lease(
  p_lease_id uuid,
  p_outcome  text,
  p_detail   text default null,
  p_seconds  int  default 0
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  kid uuid;
  ln text;
  streak int;
begin
  update gemini_key_leases
     set released_at = coalesce(released_at, now()),
         outcome = p_outcome,
         detail = left(p_detail, 500)
   where id = p_lease_id
  returning key_id, lane into kid, ln;

  if kid is null then
    return;
  end if;

  update gemini_key_lanes
     set seconds_today = seconds_today + greatest(coalesce(p_seconds, 0), 0)
   where key_id = kid and lane = ln;

  if p_outcome in ('ok', 'expired') then
    update gemini_key_lanes
       set consecutive_failures = 0, last_ok_at = now()
     where key_id = kid and lane = ln;
    return;
  end if;

  update gemini_key_lanes
     set errors_today = errors_today + 1,
         consecutive_failures = consecutive_failures + 1,
         last_error = left(coalesce(p_detail, p_outcome), 500),
         last_error_at = now()
   where key_id = kid and lane = ln
  returning consecutive_failures into streak;

  if p_outcome = 'quota_daily' then
    update gemini_key_lanes
       set status = 'exhausted', cooldown_until = next_pacific_midnight()
     where key_id = kid and lane = ln;
  elsif p_outcome = 'quota_minute' then
    update gemini_key_lanes
       set status = 'cooldown',
           cooldown_until = now() + make_interval(mins => least(power(2, greatest(streak - 1, 0))::int, 30))
     where key_id = kid and lane = ln;
  elsif p_outcome = 'concurrency' then
    update gemini_key_lanes
       set status = 'cooldown', cooldown_until = now() + interval '45 seconds'
     where key_id = kid and lane = ln;
  elsif p_outcome = 'invalid' then
    update gemini_api_keys
       set invalid = true, invalid_reason = left(p_detail, 500)
     where id = kid;
  elsif streak >= 5 then
    update gemini_key_lanes
       set status = 'cooldown', cooldown_until = now() + interval '5 minutes'
     where key_id = kid and lane = ln;
  end if;

  insert into gemini_key_events (key_id, lane, event, detail)
  values (kid, ln, p_outcome, left(p_detail, 500));
end;
$$;

-- Admin dashboard view: one row per key × lane. Never exposes the key itself.
create or replace view public.gemini_key_overview
with (security_invoker = true)
as
select
  g.id,
  g.label,
  '…' || right(g.api_key, 4) as key_hint,
  g.enabled,
  g.tier,
  g.invalid,
  g.invalid_reason,
  g.max_concurrent,
  g.priority,
  g.source,
  g.notes,
  l.lane,
  l.status,
  l.cooldown_until,
  (select count(*) from gemini_key_leases x
    where x.key_id = g.id and x.lane = l.lane
      and x.released_at is null and x.expires_at > now()) as open_leases,
  l.requests_today,
  l.errors_today,
  l.seconds_today,
  l.requests_total,
  l.consecutive_failures,
  l.last_used_at,
  l.last_ok_at,
  l.last_error,
  l.last_error_at,
  g.created_at
from gemini_api_keys g
join gemini_key_lanes l on l.key_id = g.id;

-- Only the server (service role) may touch any of this.
revoke all on public.gemini_api_keys, public.gemini_key_lanes, public.gemini_key_leases,
              public.gemini_key_events, public.gemini_key_overview from anon, authenticated;
revoke execute on function public.gemini_refresh_key_states(),
                           public.gemini_lease_key(uuid, text, int, uuid[]),
                           public.gemini_heartbeat_lease(uuid, int),
                           public.gemini_release_lease(uuid, text, text, int),
                           public.gemini_key_add_lanes()
  from public, anon, authenticated;
