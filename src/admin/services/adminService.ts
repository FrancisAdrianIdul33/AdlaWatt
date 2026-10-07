import type { ActivityLogItem } from "@/components/ActivityLogCard";

import {
  ADMIN_AUDIT_PAGE_SIZE,
  DEFAULT_ADMIN_THRESHOLDS,
  type AdminThresholds,
} from "@/admin/constants";

// ============================================================
// ADMIN SERVICE (UI-first, mock data)
//
// No Supabase calls here on purpose: RLS is strictly
// user_id = auth.uid() and users.role does not exist yet.
// Phase 2 will replace these mocks with admin-scoped reads.
// ============================================================

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
