-- =============================================================
-- Migration 004 — Guards can see expected (pre-registered) visitors
-- Adds a guard read policy on pre_registrations and publishes the
-- table for realtime so the guard home updates live when a resident
-- invites someone. Safe and idempotent.
-- =============================================================

-- Guard read policy (mirrors visitors_guard_read)
drop policy if exists "prereg_guard_read" on pre_registrations;
create policy "prereg_guard_read" on pre_registrations for select
  using (exists (select 1 from guards where supabase_auth_id = auth.uid() and is_active = true));

-- Add pre_registrations to the realtime publication (only if not already a member)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'pre_registrations'
  ) then
    alter publication supabase_realtime add table pre_registrations;
  end if;
end;
$$;
