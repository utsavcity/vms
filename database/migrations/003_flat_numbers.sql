-- =============================================================
-- Migration 003 — Rename flats to floor-based numbers
-- Floor1-A .. Floor7-H  ->  101..108, 201..208, ... 701..708
-- Safe to run on the live DB: only the flat_number label changes.
-- flat_id (UUID) is untouched, so residents/visitors stay linked.
-- =============================================================

update flats
set flat_number = (floor_number * 100 + (ascii(right(flat_number, 1)) - 64))::text
where flat_number like 'Floor%';

-- Verify: 56 rows, names like 101..708
-- select flat_number from flats order by floor_number, flat_number;
