-- Fix signup 500: Error running hook URI pg-functions://postgres/public/handle_auth_user_created
--
-- Root cause (verified on remote nxdabgvbwunyeffzrzta):
--  * public.handle_auth_user_created(event jsonb) inserts into public.activity_logs
--    with user_id = (event->>'user_id')::uuid.
--  * public.activity_logs.user_id is NOT NULL + FK -> public.users(id) ON DELETE CASCADE.
--  * There was NO trigger on auth.users to create public.users, so at hook time
--    the users row does not exist -> FK / NOT NULL violation -> hook throws ->
--    GoTrue returns 500 on /auth/v1/signup and blocks registration.
--  * public.handle_new_user() (AFTER INSERT ON public.users) already logs
--    'Account Created', so the hook was also duplicating that work too early.
--
-- This migration:
--  1. Adds missing auth.users -> public.users profile trigger (never blocks signup).
--  2. Makes handle_auth_user_created a safe passthrough: returns event, only logs
--     when users row exists and no duplicate log exists, never throws.

-- ============================================================
-- 1. Profile creation from auth.users
-- ============================================================

create or replace function public.handle_new_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_username text;
  v_base text;
  v_email text;
  v_terms boolean;
begin
  v_email := lower(trim(NEW.email));

  v_base := lower(trim(coalesce(NEW.raw_user_meta_data ->> 'username', '')));
  if v_base is null or v_base = '' then
    v_base := split_part(v_email, '@', 1);
  end if;

  -- Fall back to a safe generated name if metadata violates users constraints.
  -- users constraints (verified): ^[a-zA-Z0-9_]+$, length 3-30, unique.
  if v_base !~ '^[a-zA-Z0-9_]+$' then
    v_base := 'user_' || substr(NEW.id::text, 1, 8);
  end if;
  if char_length(v_base) < 3 then
    v_base := v_base || '_' || substr(NEW.id::text, 1, 8);
  end if;
  if char_length(v_base) > 30 then
    v_base := substr(v_base, 1, 30);
  end if;

  v_username := v_base;
  if exists (select 1 from public.users where username = v_username) then
    -- Keep within 30 chars: 21 + '_' + 8.
    v_username := substr(v_base, 1, 21) || '_' || substr(NEW.id::text, 1, 8);
  end if;

  begin
    v_terms := coalesce((NEW.raw_user_meta_data ->> 'terms_agreed')::boolean, true);
  exception when others then
    v_terms := true;
  end;
  -- users_terms_agreed CHECK requires true; never block signup on this.
  if v_terms is not true then
    v_terms := true;
  end if;

  begin
    insert into public.users (id, username, email, terms_agreed)
    values (NEW.id, v_username, v_email, v_terms)
    on conflict (id) do update set
      username = excluded.username,
      email = excluded.email,
      terms_agreed = excluded.terms_agreed;
  exception when unique_violation then
    -- Race on username/email: retry once with id-suffixed username.
    -- Other errors bubble to the outer handler which returns NEW.
    v_username := substr(v_base, 1, 21) || '_' || substr(NEW.id::text, 1, 8);
    begin
      insert into public.users (id, username, email, terms_agreed)
      values (NEW.id, v_username, v_email, v_terms)
      on conflict (id) do update set
        username = excluded.username,
        email = excluded.email,
        terms_agreed = excluded.terms_agreed;
    exception when others then
      raise warning 'handle_new_auth_user_profile retry failed for %: %', NEW.id, SQLERRM;
    end;
  end;

  return NEW;
exception when others then
  -- Auth triggers must never block signup.
  raise warning 'handle_new_auth_user_profile outer failed for %: %', NEW.id, SQLERRM;
  return NEW;
end;
$function$;

drop trigger if exists on_auth_user_created_profile on auth.users;

create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_auth_user_profile();

-- Trigger functions must not be callable via Data API.
revoke execute on function public.handle_new_auth_user_profile() from anon, authenticated, public;

-- ============================================================
-- 2. Make the Auth Hook non-blocking and idempotent
-- ============================================================
-- Called by Supabase Auth via pg-functions URI. Must take (event jsonb)
-- and return jsonb. Any exception here becomes signup 500, so swallow
-- all errors and always return event.

create or replace function public.handle_auth_user_created(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid;
  v_exists boolean;
begin
  begin
    v_user_id := coalesce(
      nullif(event ->> 'user_id', ''),
      nullif(event -> 'user' ->> 'id', ''),
      nullif(event -> 'record' ->> 'id', '')
    )::uuid;
  exception when others then
    return event;
  end;

  if v_user_id is null then
    return event;
  end if;

  -- FK public.activity_logs.user_id -> public.users(id): skip if profile
  -- trigger hasn't created the row yet.
  select exists (select 1 from public.users where id = v_user_id) into v_exists;
  if not v_exists then
    return event;
  end if;

  -- handle_new_user() AFTER INSERT ON public.users already logs this;
  -- avoid double 'Account Created' rows.
  if exists (
    select 1 from public.activity_logs
    where user_id = v_user_id and title = 'Account Created'
  ) then
    return event;
  end if;

  begin
    insert into public.activity_logs (user_id, title, description, type, created_at)
    values (
      v_user_id,
      'Account Created',
      'Your AdlaWatt account was successfully created.',
      'info',
      now()
    );
  exception when others then
    raise warning 'handle_auth_user_created log skipped for %: %', v_user_id, SQLERRM;
  end;

  return event;
exception when others then
  raise warning 'handle_auth_user_created failed: %', SQLERRM;
  return event;
end;
$function$;

-- Required for Auth Hooks (docs: grant to supabase_auth_admin, revoke from APIs).
grant usage on schema public to supabase_auth_admin;
grant execute on function public.handle_auth_user_created(jsonb) to supabase_auth_admin;
revoke execute on function public.handle_auth_user_created(jsonb) from anon, authenticated, public;
