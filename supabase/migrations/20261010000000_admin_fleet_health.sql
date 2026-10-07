-- Admin fleet-health aggregates (privacy-safe, aggregates-only).
--
-- Context: the admin dashboard must never read per-user rows
-- (see implementation plan/admin_dashboard_principles.md and the
-- strict admin/household separation). Household tables are RLS
-- user_id = auth.uid(), so the anon key cannot aggregate across
-- users. These SECURITY DEFINER functions run server-side, verify
-- the caller is role='admin', and return only fleet-wide numbers
-- (no user_ids, emails, or usernames).
--
-- Also documents the admin threshold ranges server-side so a
-- future threshold store cannot be bypassed from the client
-- (threshold Save stays staged-mock in the app).

-- Threshold ranges (mirror DEFAULT_ADMIN_THRESHOLDS in
-- src/admin/constants.ts). Used by validate_admin_thresholds().
create or replace function public.validate_admin_thresholds(
  p_voltage_min numeric,
  p_voltage_max numeric,
  p_high_load_watts numeric,
  p_battery_temp_high numeric,
  p_solar_temp_high numeric,
  p_interior_temp_high numeric
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $function$
begin
  return p_voltage_min between 10 and 13
    and p_voltage_max between 13 and 15
    and p_voltage_max > p_voltage_min
    and p_high_load_watts between 100 and 1000
    and p_battery_temp_high between 30 and 60
    and p_solar_temp_high between 40 and 80
    and p_interior_temp_high between 30 and 70;
end;
$function$;

revoke execute on function public.validate_admin_thresholds(numeric, numeric, numeric, numeric, numeric, numeric) from anon, authenticated, public;

-- Fleet health: last-24h aggregates, no per-user data.
create or replace function public.get_admin_fleet_health()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_is_admin boolean;
  v_result jsonb;
begin
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  ) into v_is_admin;

  if not coalesce(v_is_admin, false) then
    raise exception 'admin only';
  end if;

  select jsonb_build_object(
    'device_count', count(distinct user_id),
    'online_count', count(distinct user_id) filter (
      where device_status = 'Online'
        and recorded_at >= now() - interval '10 minutes'
    ),
    'avg_battery', round(avg(battery_level)::numeric, 1),
    'avg_voltage', round(avg(voltage)::numeric, 2),
    'total_solar_wh_24h', coalesce(sum(energy_input_wh) filter (
      where recorded_at >= now() - interval '24 hours'
    ), 0),
    'low_battery_count', count(*) filter (
      where battery_level < 20
        and recorded_at >= now() - interval '24 hours'
    ),
    'last_updated', max(recorded_at)
  ) into v_result
  from public.monitoring_history
  where recorded_at >= now() - interval '24 hours';

  return coalesce(v_result, jsonb_build_object(
    'device_count', 0,
    'online_count', 0,
    'avg_battery', null,
    'avg_voltage', null,
    'total_solar_wh_24h', 0,
    'low_battery_count', 0,
    'last_updated', null
  ));
end;
$function$;

revoke all on function public.get_admin_fleet_health() from public;
grant execute on function public.get_admin_fleet_health() to authenticated;

-- Needed for distinct-user aggregates at scale.
create index if not exists monitoring_history_admin_health_idx
  on public.monitoring_history (recorded_at desc, device_status)
  include (user_id, battery_level, voltage, energy_input_wh);
