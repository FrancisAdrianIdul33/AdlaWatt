-- Push notification support (Android via Expo Push Service).
--
-- Context: alert-type notifications email today (send-alert-email)
-- and buzz locally (vibration), but nothing reaches the user
-- with the app closed. This adds the two stores push needs:
--
-- 1. users.push_notifications — global per-user push switch,
--    default ON, mirroring email_notifications (server column
--    + AsyncStorage cache in settings.ts, Menu draft flow).
-- 2. push_tokens — one row per (user, device token). Tokens
--    are per-device secrets: strictly user-scoped RLS
--    (user_id = auth.uid()) for read, write, and delete.
--    Reinstalls rotate tokens: the app upserts on every
--    sign-in and deletes on sign-out, so rows stay fresh.
--    Stale-token pruning (Expo DeviceNotRegistered receipts)
--    is a phase-2 cron, not built here.

alter table public.users
add column if not exists push_notifications boolean not null default true;

create table if not exists public.push_tokens (
  user_id uuid not null references public.users (id) on delete cascade,
  expo_push_token text not null,
  platform text not null default 'android',
  updated_at timestamptz not null default now(),
  primary key (user_id, expo_push_token)
);

create index if not exists push_tokens_user_idx
  on public.push_tokens (user_id);

alter table public.push_tokens
enable row level security;

drop policy if exists "push_tokens_owner_all"
  on public.push_tokens;

create policy "push_tokens_owner_all"
  on public.push_tokens
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
