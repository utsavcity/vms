-- =============================================================
-- Utsav City VMS — PostgreSQL Schema (Supabase)
-- Run this in the Supabase SQL editor
-- =============================================================

-- Note: pgcrypto (gen_random_uuid) is pre-enabled on all Supabase projects.

-- =============================================================
-- TABLES
-- =============================================================

create table if not exists buildings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  total_floors int not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists flats (
  id uuid primary key default gen_random_uuid(),
  building_id uuid references buildings(id) on delete cascade,
  floor_number int not null,
  flat_number text not null unique,
  is_occupied boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  supabase_auth_id uuid unique,
  flat_id uuid references flats(id) on delete set null,
  name text not null,
  phone text not null unique,
  role text not null check (role in ('family_head', 'member')),
  notification_preference text[] default array['in_app'],
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists guards (
  id uuid primary key default gen_random_uuid(),
  supabase_auth_id uuid unique,
  name text not null,
  phone text not null unique,
  building_id uuid references buildings(id),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists admins (
  id uuid primary key default gen_random_uuid(),
  supabase_auth_id uuid unique,
  name text not null,
  phone text not null unique,
  role text not null check (role in ('admin', 'chairman')),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists visitors (
  id uuid primary key default gen_random_uuid(),
  flat_id uuid references flats(id),
  name text not null,
  phone text not null,
  purpose text not null,
  photo_url text,
  qr_code text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'exited')),
  entry_time timestamptz,
  exit_time timestamptz,
  approved_by_guard_id uuid references guards(id),
  pre_registration_id uuid,
  is_returning boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists visit_logs (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid references visitors(id),
  flat_id uuid references flats(id),
  guard_id uuid references guards(id),
  entry_time timestamptz not null,
  exit_time timestamptz,
  status text check (status in ('active', 'exited', 'overstay')),
  created_at timestamptz default now()
);

create table if not exists pre_registrations (
  id uuid primary key default gen_random_uuid(),
  flat_id uuid references flats(id),
  created_by_user_id uuid references users(id),
  visitor_name text not null,
  visitor_phone text not null,
  expected_date date not null,
  expected_time time,
  token text unique not null,
  status text default 'pending'
    check (status in ('pending', 'used', 'expired')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists delivery_logs (
  id uuid primary key default gen_random_uuid(),
  flat_id uuid references flats(id) not null,
  guard_id uuid references guards(id) not null,
  note text,
  notified_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null,
  recipient_type text check (recipient_type in ('user', 'guard', 'admin')),
  message text not null,
  channel text check (channel in ('whatsapp', 'sms', 'in_app')),
  is_read boolean default false,
  sent_at timestamptz default now(),
  read_at timestamptz
);

create table if not exists tenant_removal_logs (
  id uuid primary key default gen_random_uuid(),
  removed_user_id uuid not null,
  removed_user_name text not null,
  flat_id uuid references flats(id),
  removed_by_guard_id uuid references guards(id),
  removal_reason text,
  admin_notified boolean default false,
  created_at timestamptz default now()
);

create table if not exists overstay_alerts (
  id uuid primary key default gen_random_uuid(),
  visit_log_id uuid references visit_logs(id),
  visitor_id uuid references visitors(id),
  guard_id uuid references guards(id),
  alerted_at timestamptz default now(),
  resolved boolean default false
);

-- =============================================================
-- INDEXES
-- =============================================================

create index if not exists idx_visitors_phone on visitors(phone);
create index if not exists idx_visitors_status on visitors(status);
create index if not exists idx_visit_logs_status on visit_logs(status);
create index if not exists idx_visit_logs_entry_time on visit_logs(entry_time);
create index if not exists idx_notifications_recipient on notifications(recipient_id, is_read);
create index if not exists idx_pre_registrations_token on pre_registrations(token);
create index if not exists idx_pre_registrations_phone on pre_registrations(visitor_phone);
create index if not exists idx_flats_flat_number on flats(flat_number);
create index if not exists idx_users_flat_id on users(flat_id);

-- =============================================================
-- UPDATED_AT TRIGGER
-- =============================================================

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger trg_buildings_updated_at
  before update on buildings for each row execute function update_updated_at();

create or replace trigger trg_flats_updated_at
  before update on flats for each row execute function update_updated_at();

create or replace trigger trg_users_updated_at
  before update on users for each row execute function update_updated_at();

create or replace trigger trg_guards_updated_at
  before update on guards for each row execute function update_updated_at();

create or replace trigger trg_admins_updated_at
  before update on admins for each row execute function update_updated_at();

create or replace trigger trg_visitors_updated_at
  before update on visitors for each row execute function update_updated_at();

create or replace trigger trg_prereg_updated_at
  before update on pre_registrations for each row execute function update_updated_at();

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

alter table buildings enable row level security;
alter table flats enable row level security;
alter table users enable row level security;
alter table guards enable row level security;
alter table admins enable row level security;
alter table visitors enable row level security;
alter table visit_logs enable row level security;
alter table pre_registrations enable row level security;
alter table delivery_logs enable row level security;
alter table notifications enable row level security;
alter table tenant_removal_logs enable row level security;
alter table overstay_alerts enable row level security;

-- Service role bypasses RLS (backend uses service role key)
-- The policies below govern direct client access

-- Buildings: readable by all authenticated
create policy "buildings_read" on buildings for select using (auth.role() = 'authenticated');

-- Flats: readable by all authenticated
create policy "flats_read" on flats for select using (auth.role() = 'authenticated');

-- Users: users can only read their own record; guards/admins have no direct access (use service key)
create policy "users_read_own" on users for select using (auth.uid() = supabase_auth_id);
create policy "users_update_own" on users for update using (auth.uid() = supabase_auth_id);

-- Guards: guards can read their own record
create policy "guards_read_own" on guards for select using (auth.uid() = supabase_auth_id);

-- Admins: admins can read their own record
create policy "admins_read_own" on admins for select using (auth.uid() = supabase_auth_id);

-- Visitors: guards can read all; residents can read visitors for their flat
create policy "visitors_guard_read" on visitors for select
  using (exists (select 1 from guards where supabase_auth_id = auth.uid() and is_active = true));

create policy "visitors_resident_read" on visitors for select
  using (flat_id in (select flat_id from users where supabase_auth_id = auth.uid() and is_active = true));

-- Notifications: users can only see their own
create policy "notifications_read_own" on notifications for select
  using (
    recipient_id = (select id from users where supabase_auth_id = auth.uid() limit 1)
    or recipient_id = (select id from guards where supabase_auth_id = auth.uid() limit 1)
    or recipient_id = (select id from admins where supabase_auth_id = auth.uid() limit 1)
  );

create policy "notifications_update_own" on notifications for update
  using (
    recipient_id = (select id from users where supabase_auth_id = auth.uid() limit 1)
    or recipient_id = (select id from guards where supabase_auth_id = auth.uid() limit 1)
    or recipient_id = (select id from admins where supabase_auth_id = auth.uid() limit 1)
  );

-- Pre-registrations: residents can read their own flat's; guards can read all (expected-visitors list)
create policy "prereg_resident_read" on pre_registrations for select
  using (flat_id in (select flat_id from users where supabase_auth_id = auth.uid() and is_active = true));

create policy "prereg_guard_read" on pre_registrations for select
  using (exists (select 1 from guards where supabase_auth_id = auth.uid() and is_active = true));

-- Overstay alerts: guards can read
create policy "overstay_guard_read" on overstay_alerts for select
  using (exists (select 1 from guards where supabase_auth_id = auth.uid() and is_active = true));

-- =============================================================
-- REALTIME PUBLICATIONS
-- =============================================================

begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table visitors, notifications, overstay_alerts, pre_registrations;
commit;
