// ============================================================
// ADMIN CONSTANTS (UI-first)
//
// Admin-only goal/elements live here so household constants
// stay untouched. Threshold defaults seed the alert_thresholds
// backend store and back every read fallback (service cache,
// editor stale banner) — see 20261011000000_alert_thresholds.sql.
// ============================================================

export type AdminTab =
  | "overview"
  | "thresholds"
  | "audit"
  | "menu";

export const ADMIN_TABS: readonly {
  value: AdminTab;
  label: string;
  icon: "pulse" | "options" | "list" | "grid";
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
  {
    value: "menu",
    label: "Menu",
    icon: "grid",
    accessibilityLabel: "Admin menu",
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
