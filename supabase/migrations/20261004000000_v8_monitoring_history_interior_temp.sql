-- ============================================================
-- MONITORING HISTORY interior TEMP  |  VERSION v8
-- ============================================================
--
-- Adds interior_temp (numeric, nullable) to monitoring_history
-- so the Temperatures analytics card can chart a third interior
-- line (red) next to battery (green) and solar (yellow).
--
-- Existing rows stay NULL: the red line appears as new samples
-- arrive, and the chart skips NULL gaps per the NULL discipline.
-- The history writer (device/cron/trigger, outside this repo)
-- must populate the column going forward.
--
-- Safe to run again.
-- ============================================================

begin;

alter table public.monitoring_history
  add column if not exists interior_temp numeric null;

commit;
