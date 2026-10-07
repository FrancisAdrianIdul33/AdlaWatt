-- Lock users.role against client-side privilege escalation.
--
-- Context: all app updates use the anon key
-- (src/services/auth.ts updateAccount, menu.tsx preferences),
-- and the typical self-UPDATE policy (id = auth.uid()) has no
-- column guard. Without this, any signed-in user could run
-- .update({ role: 'admin' }) and defeat the admin/household
-- route separation (useAdminGuard / useHouseholdGuard are
-- client-only). Elevation stays owner-only via SQL/service_role.
--
-- This trigger allows role changes only when:
--   * auth.uid() is null (service_role / postgres bypass RLS), or
--   * the role value is unchanged (normal profile updates pass).
-- Client attempts to change role raise a clear exception and
-- change nothing.

create or replace function public.prevent_users_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if NEW.role is distinct from OLD.role then
    -- service_role / postgres have no auth.uid(); allow them.
    if auth.uid() is null then
      return NEW;
    end if;

    raise exception 'users.role is admin-managed and cannot be changed from the app (%)', auth.uid();
  end if;

  return NEW;
end;
$function$;

drop trigger if exists users_role_no_escalation on public.users;

create trigger users_role_no_escalation
before update of role on public.users
for each row execute function public.prevent_users_role_escalation();

-- Trigger functions must not be callable via Data API.
revoke execute on function public.prevent_users_role_escalation() from anon, authenticated, public;
