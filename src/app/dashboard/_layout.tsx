import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";

import { SettingsProvider } from "@/context/SettingsContext";
import {
  ThemeProvider,
  useTheme,
} from "@/context/ThemeContext";

// Side-effect import: starts the auth-aware notification
// watchers (monitoring + components) per
// implementation plan/notification_catalog.md. The service
// owns its lifecycle (starts on SIGNED_IN, stops on
// SIGNED_OUT) and never throws into the UI.
import "@/services/notificationService";

// ============================================================
// DASHBOARD LAYOUT
//
// Single shared typography + theme instances for the whole
// dashboard. Save in Menu propagates typography to all
// dashboard screens; the Dark Mode toggle applies instantly.
// Auth screens are intentionally excluded (no providers
// there — they fall back to defaults and always render
// light). StatusBar follows the active theme.
// ============================================================

function ThemedDashboard() {
  const { isDark } = useTheme();

  return (
    <SettingsProvider>
      {/* Native-only: expo-status-bar is a no-op on web. */}
      {Platform.OS !== "web" && (
        <StatusBar
          style={isDark ? "light" : "dark"}
        />
      )}
      <Slot />
    </SettingsProvider>
  );
}

export default function DashboardLayout() {
  return (
    <ThemeProvider>
      <ThemedDashboard />
    </ThemeProvider>
  );
}
