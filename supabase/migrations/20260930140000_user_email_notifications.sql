-- Global per-user alert-email preference.
--
-- The preferences modal "Email notifications" toggle gates alert-email
-- sends for the user on every device (default ON). In-app notification
-- rows are unaffected and always written.
--
-- Own-profile SELECT/UPDATE RLS already covers this column, so no new
-- policies are needed. DEFAULT true backfills all existing rows.

alter table public.users
add column if not exists email_notifications boolean not null default true;
