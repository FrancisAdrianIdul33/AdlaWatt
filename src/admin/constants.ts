// ============================================================
// ADMIN CONSTANTS (UI-first)
//
// Admin-only goal/elements live here so household constants
// stay untouched. Threshold defaults mirror the dormant
// SAFE_* = null values in notificationService (UI edits stay
// local until a backend store lands in Phase 2).
// ============================================================

export type AdminTab = "overview" | "thresholds" | "audit";

export const ADMIN_TABS: readonly {
  value: AdminTab;
  label: string;
  icon: "pulse" | "options" | "list";
  accessibilityLabel: string;
}[] = [
  {
    value: "overview",
    label: "Overview",
    icon: "pulse",
    accessibilityLabel: "Admin overview",
  },
  {
    value: "thresholds",
    label: "Thresholds",
    icon: "options",
    accessibilityLabel: "Admin thresholds",
  },
  {
    value: "audit",
    label: "Audit",
    icon: "list",
    accessibilityLabel: "Admin audit log",
  },
] as const;

export interface AdminThresholds {
  batteryVoltageMin: number;
  batteryVoltageMax: number;
  highLoadWatts: number;
  batteryTempHigh: number;
  solarTempHigh: number;
  interiorTempHigh: number;
}

export const DEFAULT_ADMIN_THRESHOLDS: AdminThresholds = {
  batteryVoltageMin: 11.6,
  batteryVoltageMax: 14.6,
  highLoadWatts: 800,
  batteryTempHigh: 45,
  solarTempHigh: 65,
  interiorTempHigh: 50,
};

export const ADMIN_AUDIT_PAGE_SIZE = 5;
