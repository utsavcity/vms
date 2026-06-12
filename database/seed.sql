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
-- Seed all 56 flats: 7 floors × 8 apartments
-- Naming: floor number + apartment, e.g. 101..108, 201..208, ... 701..708
-- =============================================================

do $$
declare
  building_id uuid := '00000000-0000-0000-0000-000000000001';
  floor int;
  apt int;
  flat_name text;
begin
  for floor in 1..7 loop
    for apt in 1..8 loop
      flat_name := (floor * 100 + apt)::text;  -- 101, 102, ... 708
      insert into flats (building_id, floor_number, flat_number, is_occupied)
      values (building_id, floor, flat_name, false)
      on conflict (flat_number) do nothing;
    end loop;
  end loop;
end;
$$;

-- Verify: should return 56
-- select count(*) from flats;
