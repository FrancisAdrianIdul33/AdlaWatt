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
// - Threshold Save stays staged-mock (no backend table yet);
//   ranges are validated server-side by
//   validate_admin_thresholds() for future use.
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
