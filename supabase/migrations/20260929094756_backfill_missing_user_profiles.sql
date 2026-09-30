-- Backfill public.users for auth.users created while signup hook was failing.
-- 7 auth.users vs 3 public.users (4 orphans verified). Uses same sanitizing
-- rules as handle_new_auth_user_profile(), idempotent.

do $backfill$
declare
  r record;
  v_username text;
  v_base text;
  v_email text;
begin
  for r in
    select au.id, au.email, au.raw_user_meta_data
    from auth.users au
    left join public.users pu on pu.id = au.id
    where pu.id is null
    order by au.created_at
  loop
    v_email := lower(trim(r.email));
    v_base := lower(trim(coalesce(r.raw_user_meta_data ->> 'username', '')));
    if v_base is null or v_base = '' then
      v_base := split_part(v_email, '@', 1);
    end if;
    if v_base !~ '^[a-zA-Z0-9_]+$' then
      v_base := 'user_' || substr(r.id::text, 1, 8);
    end if;
    if char_length(v_base) < 3 then
      v_base := v_base || '_' || substr(r.id::text, 1, 8);
    end if;
    if char_length(v_base) > 30 then
      v_base := substr(v_base, 1, 30);
    end if;

    v_username := v_base;
    if exists (select 1 from public.users where username = v_username) then
      v_username := substr(v_base, 1, 21) || '_' || substr(r.id::text, 1, 8);
    end if;

    begin
      insert into public.users (id, username, email, terms_agreed)
      values (r.id, v_username, v_email, true)
      on conflict (id) do nothing;
    exception
      when unique_violation then
        -- Duplicate username (e.g. two 'khai'): retry with suffix.
        v_username := substr(v_base, 1, 21) || '_' || substr(r.id::text, 1, 8);
        begin
          insert into public.users (id, username, email, terms_agreed)
          values (r.id, v_username, v_email, true)
          on conflict (id) do nothing;
        exception when others then
          raise warning 'backfill skipped for % (%)', r.email, SQLERRM;
        end;
      when others then
        raise warning 'backfill skipped for % (%)', r.email, SQLERRM;
    end;
  end loop;
end
$backfill$;
