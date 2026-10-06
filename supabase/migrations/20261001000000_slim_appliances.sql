-- ============================================================
-- APPLIANCES TABLE (FINAL)  |  VERSION v4 (date_created for custom appliances)
-- ============================================================
--
-- Table: public.appliances
--
-- ONE script for both cases:
--   - New database: creates the table.
--   - Old database: upgrades the old table in place.
-- Safe to run again.
--
-- Predefined (catalog) appliances live in app code
-- (GIVEN_CATALOG). This script has NO catalog inserts.
-- The table only stores what each user picked or created.
--
-- ROWS
--   type = 'given'  : a user's selected catalog appliance
--                     stores catalog_key, name, wattage_min, wattage_max
--                     deselecting DELETES the row
--   type = 'custom' : a user-created appliance
--                     stores exact wattage
--                     selection = true / false (kept when unselected)
--
-- COLUMNS
--   app_id, user_id, appliance_name, type, catalog_key,
--   wattage, wattage_min, wattage_max,
--   selection, archive, date_created
--
-- DATE_CREATED
--   Records when a custom appliance was created manually
--   in the system. It is set by the database when the row is
--   inserted and cannot be changed afterwards.
--   (Catalog picks also get a date: the moment they were picked.)
--
-- ARCHIVE
--   true  = the appliance is still selected
--   false = the appliance is not selected (archived)
--   A trigger keeps archive equal to selection.
--   Catalog picks are always true, because deselecting
--   deletes the row.
--
-- REMOVED FROM THE OLD DESIGN
--   advice, level, area, status, level trigger,
--   predefined appliance inserts
--
-- RPC FUNCTIONS
--   save_appliance_selection(p_catalog, p_custom_selected)
--   reset_appliance_selection()
--
-- WARNING: old shared seed rows (given rows with no catalog_key)
-- are deleted. They belonged to nobody, so they cannot be moved
-- to individual users.
--
-- NOTE: new check constraints are added as NOT VALID. They are
-- enforced on every new or changed row, and old rows are not
-- blocked by them.
-- ============================================================

begin;


-- ============================================================
-- 1. CREATE APPLIANCES TABLE
-- ============================================================

create table if not exists public.appliances (

    app_id uuid primary key
        default gen_random_uuid(),

    -- Owner of the row (required for every row)
    user_id uuid not null
        references public.users(id)
        on delete cascade,

    appliance_name text not null,

    -- "given"  = selected catalog appliance
    -- "custom" = user-created appliance
    type text not null
        default 'custom',

    -- Catalog appliances only. Example: catalog:stand-fan
    -- NULL for custom appliances.
    catalog_key text null,

    -- Exact wattage for custom appliances
    -- Example: 350
    wattage numeric(6,2) null,

    -- Wattage range for predefined (catalog) appliances
    -- Example: 35 - 75W
    wattage_min numeric(6,2) null,
    wattage_max numeric(6,2) null,

    -- Whether the user selected this appliance
    selection boolean not null
        default false,

    -- true  = still selected
    -- false = not selected (archived)
    -- Set automatically from "selection" by a trigger
    archive boolean not null
        default false,

    date_created timestamptz not null
        default now()

);


-- ============================================================
-- 1A. CHECK THE CORE COLUMNS EXIST
-- ============================================================
-- "create table if not exists" skips an existing table, so the
-- live table can differ from the definition above.
-- These three columns cannot be added safely to old rows,
-- so the script stops with a clear message if one is missing.

do $$
declare

    missing text;

begin

    select string_agg(req.col, ', ')
    into missing
    from (
        values ('app_id'), ('user_id'), ('appliance_name'), ('type')
    ) as req(col)
    where not exists (
        select 1
        from information_schema.columns c
        where c.table_schema = 'public'
          and c.table_name = 'appliances'
          and c.column_name = req.col
    );

    if missing is not null then

        raise exception
            'public.appliances is missing required column(s): %. Check the live table columns and update the script.',
            missing;

    end if;

end
$$;


-- ============================================================
-- 2. UPGRADE AN OLD TABLE (ADD MISSING COLUMNS)
-- ============================================================
-- Does nothing if the columns already exist.

alter table public.appliances
    add column if not exists catalog_key text;

alter table public.appliances
    add column if not exists wattage_min numeric(6,2);

alter table public.appliances
    add column if not exists wattage_max numeric(6,2);

alter table public.appliances
    add column if not exists selection boolean not null default false;

alter table public.appliances
    add column if not exists archive boolean not null default false;

-- Fix for: column "date_created" does not exist
-- Some live tables were created without it.
alter table public.appliances
    add column if not exists date_created timestamptz not null default now();


-- ============================================================
-- 2A. RELAX LEGACY NOT-NULL ON WATTAGE COLUMNS
-- ============================================================
-- Old tables declared wattage (and sometimes wattage_min /
-- wattage_max) as NOT NULL. The v4 shape stores NULL wattage
-- on given picks (range lives in wattage_min / wattage_max),
-- so those inserts fail with:
--   null value in column "wattage" violates not-null constraint
-- Dropping NOT NULL is safe to run again.
--
-- Tables predating the original DDL may lack the legacy
-- wattage column entirely (app code only reads
-- wattage_min/max). Add it nullable so the relaxations and
-- the shape checks below resolve; it stays unused.

alter table public.appliances
    add column if not exists wattage numeric(6,2);

alter table public.appliances
    alter column wattage drop not null;

alter table public.appliances
    alter column wattage_min drop not null;

alter table public.appliances
    alter column wattage_max drop not null;


-- ============================================================
-- 3. REMOVE OLD SEED ROWS AND OWNERLESS ROWS
-- ============================================================
-- New catalog picks always have a catalog_key and an owner,
-- so this never deletes real user picks when run again.

delete from public.appliances
where type = 'given'
  and catalog_key is null;

delete from public.appliances
where user_id is null;


-- ============================================================
-- 4. REMOVE OLD TRIGGERS AND FUNCTIONS
-- ============================================================
-- The old level trigger is removed (level is computed in app code).
-- The archive trigger is recreated in section 9.

drop trigger if exists appliance_level_trigger
on public.appliances;

drop trigger if exists appliance_archive_trigger
on public.appliances;

drop function if exists public.set_appliance_level();


-- ============================================================
-- 5. REMOVE OLD COLUMNS, CONSTRAINTS AND INDEXES
-- ============================================================

alter table public.appliances
    drop column if exists advice;

alter table public.appliances
    drop column if exists level;

alter table public.appliances
    drop column if exists area;

alter table public.appliances
    drop column if exists status;


alter table public.appliances
    drop constraint if exists appliances_level_check;

alter table public.appliances
    drop constraint if exists custom_appliance_user_check;

alter table public.appliances
    drop constraint if exists custom_appliance_wattage_check;


drop index if exists public.appliances_type_idx;

drop index if exists public.appliances_selection_idx;

drop index if exists public.appliances_given_name_uidx;


-- ============================================================
-- 6. MAKE WATTAGE COLUMNS NUMBERS
-- ============================================================
-- Fixes the error: operator does not exist: text > integer
--
-- Some databases store wattage, wattage_min or wattage_max
-- as TEXT. The checks below compare them with numbers,
-- so they must be numeric first.
--
-- Conversion rules:
--   "350" or "350W"  -> 350
--   anything else    -> NULL (for example a range like "35-75W")
--
-- Old check constraints that mention wattage are removed first,
-- because they block the type change. The correct checks are
-- added again in section 8.
-- Nothing happens if the columns are already numeric.

do $$
declare

    col text;

    col_type text;

    needs_fix boolean := false;

    con record;

begin

    foreach col in array array[
        'wattage',
        'wattage_min',
        'wattage_max'
    ]
    loop

        select c.data_type
        into col_type
        from information_schema.columns c
        where c.table_schema = 'public'
          and c.table_name = 'appliances'
          and c.column_name = col;

        if col_type is not null and col_type <> 'numeric' then

            needs_fix := true;

        end if;

    end loop;


    if needs_fix then

        for con in
            select conname
            from pg_constraint
            where conrelid = 'public.appliances'::regclass
              and contype = 'c'
              and pg_get_constraintdef(oid) ilike '%wattage%'
        loop

            execute format(
                'alter table public.appliances drop constraint %I',
                con.conname
            );

        end loop;

    end if;


    foreach col in array array[
        'wattage',
        'wattage_min',
        'wattage_max'
    ]
    loop

        select c.data_type
        into col_type
        from information_schema.columns c
        where c.table_schema = 'public'
          and c.table_name = 'appliances'
          and c.column_name = col;

        if col_type is not null and col_type <> 'numeric' then

            execute format(
                'alter table public.appliances alter column %I drop default',
                col
            );

            execute format(
                $f$
                alter table public.appliances
                alter column %1$I type numeric(6,2)
                using (
                    case
                        when btrim(%1$I::text)
                             ~ '^[0-9]+(\.[0-9]+)?\s*[wW]?$'
                        then regexp_replace(
                                 %1$I::text, '[^0-9.]', '', 'g'
                             )::numeric
                        else null
                    end
                )
                $f$,
                col
            );

        end if;

    end loop;

end
$$;


-- ============================================================
-- 7. OWNER AND FOREIGN KEY
-- ============================================================

alter table public.appliances
    alter column user_id set not null;

alter table public.appliances
    drop constraint if exists appliances_user_id_fkey;

alter table public.appliances
    add constraint appliances_user_id_fkey
    foreign key (user_id)
    references public.users(id)
    on delete cascade;


-- ============================================================
-- 8. VALIDATION RULES
-- ============================================================

alter table public.appliances
    drop constraint if exists appliances_type_check;

alter table public.appliances
    drop constraint if exists appliances_wattage_limit;

alter table public.appliances
    drop constraint if exists appliances_wattage_range_check;

alter table public.appliances
    drop constraint if exists appliances_name_length_check;

alter table public.appliances
    drop constraint if exists appliances_given_shape_check;

alter table public.appliances
    drop constraint if exists appliances_custom_shape_check;


alter table public.appliances
    add constraint appliances_type_check
    check (type in ('given', 'custom'));


-- Exact wattage cannot exceed 720W

alter table public.appliances
    add constraint appliances_wattage_limit
    check (
        wattage is null
        or (wattage > 0 and wattage <= 720)
    )
    not valid;


-- Minimum wattage cannot exceed maximum wattage.
-- Maximum wattage cannot exceed 720W.

alter table public.appliances
    add constraint appliances_wattage_range_check
    check (
        wattage_min is null
        or wattage_max is null
        or (
            wattage_min > 0
            and wattage_max >= wattage_min
            and wattage_max <= 720
        )
    )
    not valid;


-- Name must not be empty or too long

alter table public.appliances
    add constraint appliances_name_length_check
    check (
        char_length(btrim(appliance_name)) between 1 and 120
    )
    not valid;


-- Given pick: has a catalog key, is selected,
-- has a wattage range, and has no exact wattage.

alter table public.appliances
    add constraint appliances_given_shape_check
    check (
        type <> 'given'
        or (
            catalog_key like 'catalog:%'
            and selection
            and wattage is null
            and wattage_min is not null
            and wattage_max is not null
        )
    )
    not valid;


-- Custom appliance shape check is intentionally NOT created:
-- app writes store the interval in wattage_min/max with
-- wattage NULL, so requiring wattage NOT NULL would reject
-- every custom insert/update going forward (and already broke
-- the backfill below on live v5 rows). Drop it if any variant
-- exists from a hand-applied schema.

alter table public.appliances
    drop constraint if exists appliances_custom_shape_check;


-- ============================================================
-- 9. AUTOMATIC ARCHIVE STATUS
-- ============================================================
-- archive follows selection:
--
--   selection = true   ->  archive = true   (still selected)
--   selection = false  ->  archive = false  (not selected, archived)
--
-- Runs on every insert and whenever selection or archive changes.
-- ============================================================

create or replace function public.set_appliance_archive()
returns trigger
language plpgsql
set search_path = public
as $$
begin

    new.archive := new.selection;

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


-- Make existing rows match their selection value.
--
-- Hand-applied variants of this database may carry an
-- archive state check (v6 semantics) that this backfill
-- would violate. The decoupled model needs no archive
-- check at all, so drop any such constraint first.

alter table public.appliances
    drop constraint if exists appliances_archive_state_check;

update public.appliances
set archive = selection
where archive is distinct from selection;


-- ============================================================
-- 9A. LOCK date_created
-- ============================================================
-- date_created records when a custom appliance was created
-- manually in the system.
--   insert : always set by the database (now())
--   update : the old value is kept, so users cannot change it
--
-- Rows that existed before this column was added get the time
-- this script ran, because the real creation time is unknown.

create or replace function public.set_appliance_date_created()
returns trigger
language plpgsql
set search_path = public
as $$
begin

    if tg_op = 'INSERT' then

        new.date_created := now();

    else

        new.date_created := old.date_created;

    end if;

    return new;

end;
$$;


drop trigger if exists appliance_date_created_trigger
on public.appliances;

create trigger appliance_date_created_trigger
before insert or update
on public.appliances
for each row
execute function public.set_appliance_date_created();


-- ============================================================
-- 10. INDEXES
-- ============================================================

-- Fast lookup of a user's appliances

create index if not exists appliances_user_id_idx
on public.appliances(user_id);


-- Fast lookup of a user's selected / archived appliances

create index if not exists appliances_user_archive_idx
on public.appliances(user_id, archive);


-- One pick per catalog item per user.
-- Not partial, so Supabase upsert
-- (onConflict: 'user_id,catalog_key') works.
-- Customs have a NULL catalog_key, so they never conflict.

create unique index if not exists appliances_user_catalog_key_uidx
on public.appliances(user_id, catalog_key);


-- ============================================================
-- 11. ROW LEVEL SECURITY
-- ============================================================
-- No catalog read policy is needed (the catalog is in code).
-- Every user only sees and changes their own rows.

alter table public.appliances enable row level security;


drop policy if exists "Authenticated users can view given appliances"
on public.appliances;

drop policy if exists "Users can view their custom appliances"
on public.appliances;

drop policy if exists "Users can create custom appliances"
on public.appliances;

drop policy if exists "Users can update their custom appliances"
on public.appliances;

drop policy if exists "Users can delete their custom appliances"
on public.appliances;

drop policy if exists "Users can view own appliances"
on public.appliances;

drop policy if exists "Users can add own appliances"
on public.appliances;

drop policy if exists "Users can update own custom appliances"
on public.appliances;

drop policy if exists "Users can delete own appliances"
on public.appliances;


-- ------------------------------------------------------------
-- SELECT: own rows only
-- ------------------------------------------------------------

create policy "Users can view own appliances"
on public.appliances
for select
to authenticated
using (
    user_id = (select auth.uid())
);


-- ------------------------------------------------------------
-- INSERT: only for yourself
-- ------------------------------------------------------------

create policy "Users can add own appliances"
on public.appliances
for insert
to authenticated
with check (
    user_id = (select auth.uid())
);


-- ------------------------------------------------------------
-- UPDATE: own custom appliances only
-- Catalog picks are never edited (deselect = delete).
-- ------------------------------------------------------------

create policy "Users can update own custom appliances"
on public.appliances
for update
to authenticated
using (
    type = 'custom'
    and user_id = (select auth.uid())
)
with check (
    type = 'custom'
    and user_id = (select auth.uid())
);


-- ------------------------------------------------------------
-- DELETE: own rows (catalog picks and customs)
-- ------------------------------------------------------------

create policy "Users can delete own appliances"
on public.appliances
for delete
to authenticated
using (
    user_id = (select auth.uid())
);


-- ============================================================
-- 12. REST GRANTS
-- ============================================================

revoke all
on public.appliances
from anon;

grant select, insert, update, delete
on public.appliances
to authenticated;


-- ============================================================
-- 13. RPC: SAVE SELECTION
-- ============================================================
-- One atomic call for handleSave.
--
--   p_catalog         : JSON array of selected catalog items
--                       [{"key":"catalog:...","name":"...",
--                         "wattMin":35,"wattMax":75}]
--   p_custom_selected : uuid array of selected custom appliances
--
-- It will:
--   1. delete catalog picks that are no longer in p_catalog
--   2. insert newly selected catalog items
--      (with their wattage_min and wattage_max)
--   3. set selection on the user's custom appliances
--      (archive follows selection through the trigger)
--
-- Items with a bad key, name or wattage range are skipped.
-- Returns the number of selected appliances
-- (catalog picks + selected customs).
-- Runs as the caller, so RLS always applies.
-- ============================================================

drop function if exists
public.save_appliance_selection(jsonb, uuid[]);


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


    -- 3. Update selection of custom appliances

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
-- 14. RPC: RESET SELECTION
-- ============================================================
-- For handleReset.
--   - deletes the user's catalog picks
--   - unselects the user's customs (customs are kept,
--     and archive becomes false through the trigger)
-- ============================================================

drop function if exists
public.reset_appliance_selection();


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
    set selection = false
    where a.user_id = uid
      and a.type = 'custom'
      and a.selection;

end;
$$;


revoke execute
on function public.reset_appliance_selection()
from public, anon;

grant execute
on function public.reset_appliance_selection()
to authenticated;


-- ============================================================
-- 15. VERIFY APPLIANCES
-- ============================================================

select
    column_name,
    data_type,
    is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'appliances'
order by ordinal_position;


select *
from public.appliances
order by type, appliance_name;


select
    type,
    archive,
    count(*) as row_count
from public.appliances
group by type, archive
order by type, archive;


commit;
