import type { ActivityLogItem } from "@/components/ActivityLogCard";
import { supabase } from "@/lib/supabase";

import {
  ADMIN_AUDIT_PAGE_SIZE,
  DEFAULT_ADMIN_THRESHOLDS,
  type AdminThresholds,
} from "@/admin/constants";

// ============================================================
// ADMIN SERVICE
//
// UI-first with privacy-safe real reads where possible.
// - Fleet health comes from the aggregates-only RPC
//   get_admin_fleet_health() (no per-user rows, admin-only,
//   see 20261010000000_admin_fleet_health.sql). On RPC failure
//   (offline, not yet pushed, RLS) callers fall back to the
//   mocks below with stale=true so the UI shows a "stale data"
//   banner instead of a blank page.
// - Thresholds publish to the alert_thresholds backend
//   store (getPublishedThresholds / publishThresholds below);
//   temperature rows are stored but staged-only (no consumer
//   rules yet). Ranges are validated server-side by
//   validate_admin_thresholds() so the store cannot be
//   bypassed from the client.
// ============================================================

export interface AdminFleetHealth {
  deviceCount: number;
  onlineCount: number;
  avgBattery: number | null;
  avgVoltage: number | null;
  totalSolarWh24h: number;
  lowBatteryCount: number;
  lastUpdated: string | null;
  /** True when the RPC failed and mock data is shown. */
  stale: boolean;
  /** RPC round-trip ms (latency budget: sub-3s per principles). */
  latencyMs: number;
}

export interface AdminOverview {
  deviceStatus: "Online" | "Offline";
  batteryLevel: number;
  batteryVoltage: number;
  solarInput: number;
  currentLoad: number;
  batteryTemp: number;
  solarTemp: number;
  interiorTemp: number;
  unreadAlerts: number;
  lastSync: string;
}

const MOCK_OVERVIEW: AdminOverview = {
  deviceStatus: "Online",
  batteryLevel: 78,
  batteryVoltage: 12.8,
  solarInput: 210,
  currentLoad: 120,
  batteryTemp: 32,
  solarTemp: 41,
  interiorTemp: 29,
  unreadAlerts: 3,
  lastSync: "just now",
};

const MOCK_AUDIT: ActivityLogItem[] = [
  {
    id: "adm-001",
    type: "info",
    title: "Threshold draft saved",
    details: "High-load cap staged at 800W (not yet published).",
    date: "Oct 7, 2026",
    time: "09:12 AM",
  },
  {
    id: "adm-002",
    type: "warning",
    title: "Solar input dipped",
    details: "Input fell below 50W for 10 minutes on the test bench.",
    date: "Oct 6, 2026",
    time: "04:47 PM",
  },
  {
    id: "adm-003",
    type: "error",
    title: "Device offline blip",
    details: "ESP32 heartbeat missed twice, then recovered.",
    date: "Oct 6, 2026",
    time: "02:03 PM",
  },
  {
    id: "adm-004",
    type: "critical",
    title: "Battery temp elevated",
    details: "Battery sensor crossed 45C in the enclosure test.",
    date: "Oct 5, 2026",
    time: "01:20 PM",
  },
  {
    id: "adm-005",
    type: "info",
    title: "Admin preview opened",
    details: "UI-first admin dashboard rendered with mock data.",
    date: "Oct 5, 2026",
    time: "09:00 AM",
  },
  {
    id: "adm-006",
    type: "info",
    title: "Forecast sync ok",
    details: "5-day solar outlook refreshed without blocking monitoring.",
    date: "Oct 4, 2026",
    time: "08:15 AM",
  },
  {
    id: "adm-007",
    type: "warning",
    title: "Load spike noted",
    details: "Current load crossed 400W during appliance test.",
    date: "Oct 3, 2026",
    time: "06:40 PM",
  },
];

export function getMockAdminOverview(): AdminOverview {
  return { ...MOCK_OVERVIEW };
}

export async function getAdminFleetHealth(): Promise<AdminFleetHealth> {
  const started = Date.now();

  try {
    const { data, error } = await supabase.rpc(
      "get_admin_fleet_health",
    );

    if (error) {
      throw new Error(error.message);
    }

    const row = (data ?? {}) as {
      device_count?: number;
      online_count?: number;
      avg_battery?: number | null;
      avg_voltage?: number | null;
      total_solar_wh_24h?: number;
      low_battery_count?: number;
      last_updated?: string | null;
    };

    return {
      deviceCount: row.device_count ?? 0,
      onlineCount: row.online_count ?? 0,
      avgBattery:
        typeof row.avg_battery === "number"
          ? row.avg_battery
          : null,
      avgVoltage:
        typeof row.avg_voltage === "number"
          ? row.avg_voltage
          : null,
      totalSolarWh24h: row.total_solar_wh_24h ?? 0,
      lowBatteryCount: row.low_battery_count ?? 0,
      lastUpdated: row.last_updated ?? null,
      stale: false,
      latencyMs: Date.now() - started,
    };
  } catch (thrown) {
    console.warn(
      "Admin fleet health RPC failed, showing mock:",
      thrown instanceof Error ? thrown.message : thrown,
    );

    return {
      deviceCount: 1,
      onlineCount: 1,
      avgBattery: MOCK_OVERVIEW.batteryLevel,
      avgVoltage: MOCK_OVERVIEW.batteryVoltage,
      totalSolarWh24h: 0,
      lowBatteryCount: 0,
      lastUpdated: null,
      stale: true,
      latencyMs: Date.now() - started,
    };
  }
}

export function getMockAuditLogs(): ActivityLogItem[] {
  return [...MOCK_AUDIT];
}

export function getDefaultThresholds(): AdminThresholds {
  return { ...DEFAULT_ADMIN_THRESHOLDS };
}

/* ============================================================
   PUBLISHED THRESHOLDS (backend store)
   Single global row in public.alert_thresholds (see
   20261011000000_alert_thresholds.sql): admins publish, every
   household watcher reads through its own cache.
   ============================================================ */

export interface PublishedThresholds {
  thresholds: AdminThresholds;
  /** True when the read failed and defaults are shown. */
  stale: boolean;
}

interface ThresholdRow {
  battery_voltage_min?: unknown;
  battery_voltage_max?: unknown;
  high_load_watts?: unknown;
  battery_temp_high?: unknown;
  solar_temp_high?: unknown;
  interior_temp_high?: unknown;
}

const toFiniteNumber = (
  value: unknown,
  fallback: number,
): number => {
  // Nullish and empty cells fall back per-field: coercing
  // null to 0 would arm a 0W high-load trip (every load
  // alerts) or a 0V window, so absence must mean default.
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  const parsed =
    typeof value === "number"
      ? value
      : Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
};

const rowToThresholds = (
  row: ThresholdRow,
): AdminThresholds => {
  const defaults = getDefaultThresholds();

  return {
    batteryVoltageMin: toFiniteNumber(
      row.battery_voltage_min,
      defaults.batteryVoltageMin,
    ),
    batteryVoltageMax: toFiniteNumber(
      row.battery_voltage_max,
      defaults.batteryVoltageMax,
    ),
    highLoadWatts: toFiniteNumber(
      row.high_load_watts,
      defaults.highLoadWatts,
    ),
    batteryTempHigh: toFiniteNumber(
      row.battery_temp_high,
      defaults.batteryTempHigh,
    ),
    solarTempHigh: toFiniteNumber(
      row.solar_temp_high,
      defaults.solarTempHigh,
    ),
    interiorTempHigh: toFiniteNumber(
      row.interior_temp_high,
      defaults.interiorTempHigh,
    ),
  };
};

/** Client-side mirror of validate_admin_thresholds() ranges
 *  (editor steppers already clamp to these; the DB CHECK is
 *  the real gate and rejects bypasses server-side). */
export function isValidThresholds(
  values: AdminThresholds,
): boolean {
  return (
    values.batteryVoltageMin >= 10 &&
    values.batteryVoltageMin <= 13 &&
    values.batteryVoltageMax >= 13 &&
    values.batteryVoltageMax <= 15 &&
    values.batteryVoltageMax >
      values.batteryVoltageMin &&
    values.highLoadWatts >= 100 &&
    values.highLoadWatts <= 1000 &&
    values.batteryTempHigh >= 30 &&
    values.batteryTempHigh <= 60 &&
    values.solarTempHigh >= 40 &&
    values.solarTempHigh <= 80 &&
    values.interiorTempHigh >= 30 &&
    values.interiorTempHigh <= 70
  );
}

export async function getPublishedThresholds(): Promise<PublishedThresholds> {
  try {
    const { data, error } = await supabase
      .from("alert_thresholds")
      .select(
        [
          "battery_voltage_min",
          "battery_voltage_max",
          "high_load_watts",
          "battery_temp_high",
          "solar_temp_high",
          "interior_temp_high",
        ].join(","),
      )
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error(
        "No published thresholds row.",
      );
    }

    return {
      thresholds: rowToThresholds(
        data as ThresholdRow,
      ),
      stale: false,
    };
  } catch (thrown) {
    console.warn(
      "Published thresholds read failed, showing defaults:",
      thrown instanceof Error
        ? thrown.message
        : thrown,
    );

    return {
      thresholds: getDefaultThresholds(),
      stale: true,
    };
  }
}

export async function publishThresholds(
  values: AdminThresholds,
): Promise<void> {
  if (!isValidThresholds(values)) {
    throw new Error(
      "Thresholds are outside the allowed ranges.",
    );
  }

  const { data: userData } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("alert_thresholds")
    .update({
      battery_voltage_min:
        values.batteryVoltageMin,
      battery_voltage_max:
        values.batteryVoltageMax,
      high_load_watts: values.highLoadWatts,
      battery_temp_high:
        values.batteryTempHigh,
      solar_temp_high: values.solarTempHigh,
      interior_temp_high:
        values.interiorTempHigh,
      updated_at: new Date().toISOString(),
      updated_by:
        userData.user?.id ?? null,
    })
    .eq("id", 1);

  if (error) {
    throw new Error(error.message);
  }
}

export function paginateAudit(
  logs: ActivityLogItem[],
  page: number,
  pageSize: number = ADMIN_AUDIT_PAGE_SIZE,
): { items: ActivityLogItem[]; totalPages: number } {
  const totalPages = Math.max(
    1,
    Math.ceil(logs.length / pageSize),
  );
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: logs.slice(start, start + pageSize),
    totalPages,
  };
}
