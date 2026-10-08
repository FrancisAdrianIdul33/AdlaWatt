-- Global alert thresholds (admin-published, fleet-wide).
--
-- Context: notificationService safety rules (high current load,
-- battery voltage min/max) were dormant behind SAFE_* = null
-- because no backend store existed (ThresholdEditor Save only
-- staged locally). This table is that store: a singleton row
-- (id = 1) published by admins and read by every household
-- watcher through an in-memory cache (never per-evaluation).
--
-- Design follows the admin/household separation in
-- 20261010000000_admin_fleet_health.sql: thresholds are
-- fleet-wide config (no per-user data), so any authenticated
-- user may read, but only users.role = 'admin' may write.
-- Admin elevation stays owner-only via SQL (see
-- 20261007000000_user_roles.sql) — never from the app client.
--
-- Temperature columns (battery/solar/interior) are stored for
-- forward compatibility but have no consumer rules yet: temp
-- alerts come from ESP32 status transitions, not thresholds.
-- The editor marks those rows staged-only.

create table if not exists public.alert_thresholds (
  id integer primary key default 1 check (id = 1),
  battery_voltage_min numeric not null,
  battery_voltage_max numeric not null,
  high_load_watts numeric not null,
  battery_temp_high numeric not null,
  solar_temp_high numeric not null,
  interior_temp_high numeric not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.users (id),
  constraint alert_thresholds_valid check (
    public.validate_admin_thresholds(
      battery_voltage_min,
      battery_voltage_max,
      high_load_watts,
      battery_temp_high,
      solar_temp_high,
      interior_temp_high
    )
  )
);

-- Seed = DEFAULT_ADMIN_THRESHOLDS (src/admin/constants.ts).
insert into public.alert_thresholds (
  id,
  battery_voltage_min,
  battery_voltage_max,
  high_load_watts,
  battery_temp_high,
  solar_temp_high,
  interior_temp_high
)
values (1, 11.6, 14.6, 800, 45, 65, 50)
on conflict (id) do nothing;

alter table public.alert_thresholds
enable row level security;

drop policy if exists "alert_thresholds_read_all"
  on public.alert_thresholds;

create policy "alert_thresholds_read_all"
  on public.alert_thresholds
  for select
  to authenticated
  using (true);

drop policy if exists "alert_thresholds_admin_write"
  on public.alert_thresholds;

create policy "alert_thresholds_admin_write"
  on public.alert_thresholds
  for all
  to authenticated
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );
