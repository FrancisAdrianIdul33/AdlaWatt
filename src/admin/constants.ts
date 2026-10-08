// ============================================================
// ADMIN CONSTANTS (UI-first)
//
// Admin shell only: the dashboard is a starting UI with
// account actions (Log Out / Exit). No operational tabs.
// ============================================================

export type AdminTab = "menu";

export const ADMIN_TABS: readonly {
  value: AdminTab;
  label: string;
  icon: "grid";
  accessibilityLabel: string;
}[] = [
  {
    value: "menu",
    label: "Menu",
    icon: "grid",
    accessibilityLabel: "Admin menu",
  },
] as const;
