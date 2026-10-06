-- ============================================================
-- RESET RPC  |  SELECTION ONLY (no archive side effects)
-- ============================================================
--
-- Product decision change: Reset means DESELECT, not archive.
-- The v7 reset set archive=true + selection=false (moving
-- Layer 1 customs to Layer 2), which contradicts v7's own
-- Save contract ("deselect stays visible"). From here:
--
--   - given rows are deleted (they exist only when picked)
--   - custom rows get selection=false, archive untouched,
--     so they stay visible unticked in Layer 1
--   - explicit archive icon / unarchive flows are unchanged
--
-- Grants are preserved. Safe to run again.
-- ============================================================

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
      and a.selection is distinct from false;

end;
$$;


revoke execute
on function public.reset_appliance_selection()
from public, anon;

grant execute
on function public.reset_appliance_selection()
to authenticated;
