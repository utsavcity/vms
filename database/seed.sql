-- =============================================================
-- Utsav City VMS — Seed Data
-- Run AFTER schema.sql
-- =============================================================

-- Insert Utsav City building
insert into buildings (id, name, address, total_floors)
values (
  '00000000-0000-0000-0000-000000000001',
  'Utsav City',
  'Utsav City, Mumbai, Maharashtra',
  7
)
on conflict (id) do nothing;

-- =============================================================
-- Seed all 56 flats: 7 floors × 8 apartments (A through H)
-- Naming: Floor1-A, Floor1-B, ..., Floor7-H
-- =============================================================

do $$
declare
  building_id uuid := '00000000-0000-0000-0000-000000000001';
  floor int;
  apt_letters text[] := array['A','B','C','D','E','F','G','H'];
  letter text;
  flat_name text;
begin
  for floor in 1..7 loop
    foreach letter in array apt_letters loop
      flat_name := 'Floor' || floor || '-' || letter;
      insert into flats (building_id, floor_number, flat_number, is_occupied)
      values (building_id, floor, flat_name, false)
      on conflict (flat_number) do nothing;
    end loop;
  end loop;
end;
$$;

-- Verify: should return 56
-- select count(*) from flats;
