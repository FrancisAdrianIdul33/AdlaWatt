-- ============================================================
-- APPLIANCES archive FLAG  |  VERSION v6 (archive=true means archived)
-- ============================================================
--
-- Small delta on top of v5. Only the meaning of the archive
-- column changes:
--
--   v5 : archive := selection      (true = still selected)
--   v6 : archive := NOT selection  (true = archived / hidden)
--
--   selection = true   ->  archive = false  (active, shown)
--   selection = false  ->  archive = true   (archived, hidden)
--
-- Catalog picks are always selection = true, so archive = false.
-- Custom appliances: deselecting (untick + save, reset, or the
-- box archive icon) stores archive = true, and the modal hides
-- every row with archive = true. Unarchiving is a future
-- archives viewer (sets selection back to true).
--
-- Constraints, RLS, indexes, and both RPC functions are
-- untouched: none of them read the archive column.
--
-- Safe to run again.
-- ============================================================

begin;


-- ============================================================
-- 1. FLIP THE TRIGGER LOGIC
-- ============================================================

create or replace function public.set_appliance_archive()
returns trigger
language plpgsql
set search_path = public
as $$
begin

    new.archive := not new.selection;

    return new;

end;
$$;


drop trigger if exists appliance_archive_trigger
on public.appliances;

create trigger appliance_archive_trigger
before insert or update of selection, archive
on public.appliances
for each row
execute function public.set_appliance_archive();


-- ============================================================
-- 2. BACKFILL ROWS WRITTEN UNDER v5
-- ============================================================
-- Under v5 the trigger stored archive = selection, so every
-- row with archive equal to selection still carries the old
-- meaning. Flip those to the v6 meaning. Rows already
-- correct under v6 (archive <> selection) are untouched.

update public.appliances
set archive = not selection
where archive is not distinct from selection;


-- ============================================================
-- 3. VERIFY APPLIANCES
-- ============================================================

select
    type,
    selection,
    archive,
    count(*) as row_count
from public.appliances
group by type, selection, archive
order by type, selection, archive;


commit;
