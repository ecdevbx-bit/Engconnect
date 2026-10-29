-- Pro payments through a self-hosted YouPI PG gateway (D-061).
-- One row per checkout attempt; our id is the gateway's orderId. Webhook
-- deliveries are recorded by their gateway delivery id so retries are no-ops.
-- Service role only (RLS on, no policies).

create table if not exists public.pro_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- What was charged and what it buys, frozen at checkout time.
  amount_paise integer not null check (amount_paise > 0),
  base_paise integer not null check (base_paise > 0),
  discount_percent integer not null default 0 check (discount_percent between 0 and 95),
  duration_days integer not null check (duration_days between 1 and 3650),
  -- created → observed (bank alert matched) → paid (Pro granted)
  -- or review / failed / expired / cancelled.
  status text not null default 'created'
    check (status in ('created', 'observed', 'paid', 'review', 'failed', 'expired', 'cancelled')),
  gateway_payment_id text,
  checkout_url text,
  utr text,
  last_event text,
  granted_until timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pro_payments_user_created on public.pro_payments (user_id, created_at desc);
create index if not exists pro_payments_created on public.pro_payments (created_at desc);

create table if not exists public.pro_payment_deliveries (
  delivery_id text primary key,
  payment_id uuid references public.pro_payments (id) on delete cascade,
  event text not null,
  received_at timestamptz not null default now()
);

alter table public.pro_payments enable row level security;
alter table public.pro_payment_deliveries enable row level security;
