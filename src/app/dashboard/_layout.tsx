import { Slot, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import { useEffect } from "react";

import { SettingsProvider } from "@/context/SettingsContext";
import {
  ThemeProvider,
  useTheme,
} from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";

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
// dashboard, behind an auth guard (unauthenticated deep-links
// bounce to login). Save in Menu propagates typography to all
// dashboard screens; the Dark Mode toggle applies instantly.
// Auth screens live in their own layout with the saved theme.
// StatusBar follows the active theme.
// ============================================================

function ThemedDashboard() {
  const { isDark } = useTheme();
  const { isLoaded, isSignedIn } = useAuth();

  // Auth guard: unauthenticated deep-links land here
  // without passing through splash.
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/auth/login");
    }
  }, [isLoaded, isSignedIn]);

  if (!isLoaded || !isSignedIn) {
    return null;
  }

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
