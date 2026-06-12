-- Web Push subscriptions (PWA migration) — additive only, nothing existing is touched.
-- Run in the Supabase SQL editor.

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null,
  recipient_type text check (recipient_type in ('user', 'guard', 'admin')),
  endpoint text unique not null,
  subscription jsonb not null,
  created_at timestamptz default now()
);

create index if not exists idx_push_subs_recipient on push_subscriptions(recipient_id);

-- Service-role access only (backend); no client policies needed.
alter table push_subscriptions enable row level security;
