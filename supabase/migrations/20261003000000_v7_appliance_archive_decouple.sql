-- ============================================================
-- APPLIANCES archive FLAG  |  VERSION v7 (archive decoupled)
-- ============================================================
--
-- Layered modal decision: unarchive restores as visible but
-- UNSELECTED (archive=false + selection=false). Under v6 this
-- state was impossible because the trigger forced:
--
--   archive := NOT selection
--
-- v7 decouples the flag:
--
--   - archive is manual (no trigger sync)
--   - Layer 1 lists archive=false (checked or not)
--   - Layer 2 lists archive=true
--   - Save RPC touches selection only (deselect stays visible)
--   - Explicit archive icon sets archive=true
--   - Unarchive sets archive=false + selection=false
--   - Reset sets archive=true + selection=false (moves to Layer 2)
--
-- Also fixes the `type` column default: live schema declares
-- DEFAULT 'catalog', which violates its own
-- appliances_type_check (allows only 'given'/'custom'), so any
-- future insert omitting `type` fails. App code always sends
-- `type` explicitly today; this just removes the landmine.
--
-- If the live save/reset RPCs were hand-fixed since v4, diff
-- their bodies first (see review queries below) — this file
-- rewrites both functions.
--
-- Existing rows already satisfy archive = NOT selection, which
-- is a valid decoupled starting point, so no backfill.
--
-- Safe to run again.
-- ============================================================

begin;


-- ============================================================
-- 0. FIX type DEFAULT ('catalog' violates type check)
-- ============================================================
-- Affects future inserts only; existing rows untouched.

alter table public.appliances
    alter column type set default 'custom';


-- ============================================================
-- 1. DROP THE AUTO-SYNC TRIGGER
-- ============================================================
-- Archive becomes a manual flag owned by the app. Keeping the
-- helper function is harmless, but the trigger must go so a
-- visible+unticked row (archive=false, selection=false) can
-- exist for the Layer 2 -> Layer 1 restore path.

drop trigger if exists appliance_archive_trigger
on public.appliances;


-- ============================================================
-- 2. RESET RPC: ARCHIVE EXPLICITLY
-- ============================================================
-- Under v6, setting selection=false auto-archived through the
-- trigger. With the trigger gone, reset must set both flags so
-- Layer 1 customs move to Layer 2 as before.

create or replace function
public.reset_appliance_selection()
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare

    uid uuid := (select auth.uid());

begin

    if uid is null then

        raise exception 'Not authenticated.';

    end if;


    delete from public.appliances a
    where a.user_id = uid
      and a.type = 'given';


    update public.appliances a
    set selection = false,
        archive = true
    where a.user_id = uid
      and a.type = 'custom'
      and (a.selection or a.archive = false);

end;
$$;


revoke execute
on function public.reset_appliance_selection()
from public, anon;

grant execute
on function public.reset_appliance_selection()
to authenticated;


-- ============================================================
-- 3. SAVE RPC: SELECTION ONLY (NO ARCHIVE TOUCH)
-- ============================================================
-- Re-created without archive side effects for clarity. Deselect
-- via Save (untick + Add) leaves archive=false so the item stays
-- visible unticked in Layer 1. Only the explicit archive icon
-- (archive=true) moves a row to Layer 2.

create or replace function
public.save_appliance_selection(
    p_catalog jsonb,
    p_custom_selected uuid[] default '{}'::uuid[]
)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare

    uid uuid := (select auth.uid());

    selected_ids uuid[] :=
        coalesce(p_custom_selected, '{}'::uuid[]);

    pick_count integer;

begin

    if uid is null then

        raise exception 'Not authenticated.';

    end if;


    if p_catalog is null
       or jsonb_typeof(p_catalog) <> 'array'
    then

        raise exception 'p_catalog must be a JSON array.';

    end if;


    if jsonb_array_length(p_catalog) > 200 then

        raise exception 'p_catalog is too large.';

    end if;


    -- 1. Delete deselected catalog picks

    delete from public.appliances a
    where a.user_id = uid
      and a.type = 'given'
      and not exists (
          select 1
          from jsonb_array_elements(p_catalog) i
          where i->>'key' = a.catalog_key
      );


    -- 2. Insert newly selected catalog picks

    insert into public.appliances (
        user_id,
        appliance_name,
        type,
        catalog_key,
        wattage_min,
        wattage_max,
        selection
    )
    select distinct on (p.item_key)
        uid,
        p.item_name,
        'given',
        p.item_key,
        p.watt_min,
        p.watt_max,
        true
    from (

        select
            i->>'key' as item_key,

            btrim(i->>'name') as item_name,

            case
                when (i->>'wattMin') ~ '^[0-9]+(\.[0-9]+)?$'
                then (i->>'wattMin')::numeric
            end as watt_min,

            case
                when (i->>'wattMax') ~ '^[0-9]+(\.[0-9]+)?$'
                then (i->>'wattMax')::numeric
            end as watt_max

        from jsonb_array_elements(p_catalog) i

    ) p
    where p.item_key like 'catalog:%'
      and char_length(coalesce(p.item_name, '')) between 1 and 120
      and p.watt_min > 0
      and p.watt_max >= p.watt_min
      and p.watt_max <= 720
    order by p.item_key
    on conflict (user_id, catalog_key)
    do nothing;


    -- 3. Update selection of custom appliances (archive untouched)

    update public.appliances a
    set selection = (a.app_id = any(selected_ids))
    where a.user_id = uid
      and a.type = 'custom'
      and a.selection is distinct from
          (a.app_id = any(selected_ids));


    -- 4. Count selected appliances

    select count(*)
    into pick_count
    from public.appliances a
    where a.user_id = uid
      and (a.type = 'given' or a.selection);


    return pick_count;

end;
$$;


revoke execute
on function public.save_appliance_selection(jsonb, uuid[])
from public, anon;

grant execute
on function public.save_appliance_selection(jsonb, uuid[])
to authenticated;


-- ============================================================
-- 4. VERIFY APPLIANCES
-- ============================================================

select
    type,
    selection,
    archive,
    count(*) as row_count
from public.appliances
group by type, selection, archive
order by type, selection, archive;


-- Trigger must be gone (decoupled archive allows
-- archive=false + selection=false for unticked restore).
select trigger_name
from information_schema.triggers
where event_object_table = 'appliances'
  and trigger_name = 'appliance_archive_trigger';


-- type default must no longer violate the type check.
select column_name, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'appliances'
  and column_name = 'type';


commit;
