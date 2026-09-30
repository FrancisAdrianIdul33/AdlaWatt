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
import {
  initializeNotificationService,
  shutdownNotificationService,
} from "@/services/notificationService";

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

  // Notification service lifecycle: start explicitly only
  // when signed in. No import-time side effect, so the login
  // screen / fresh install never probes getUser() with no
  // session (previously "Auth session missing!").
  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (isSignedIn) {
      initializeNotificationService().catch((error) => {
        console.error(
          "Failed to initialize notification service:",
          error,
        );
      });
    } else {
      shutdownNotificationService().catch(() => {
        // Shutdown is best-effort; never throws into UI.
      });
    }

    return () => {
      // Best-effort cleanup on unmount (e.g. logout
      // navigates away from dashboard).
      shutdownNotificationService().catch(() => {});
    };
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
