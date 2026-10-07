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

// ============================================================
// ADMIN LAYOUT
//
// Mirrors app/dashboard/_layout.tsx shell (Theme + Settings,
// StatusBar follows theme) but WITHOUT household bottom tabs
// and WITHOUT the notification-service lifecycle. Admin uses
// its own AdminScreenContainer + AdminNavBarBottom from
// src/admin/. UI-only phase: auth guard only; role check lives
// in useAdminGuard (mock allow, real users.role deferred).
// ============================================================

function ThemedAdmin() {
  const { isDark } = useTheme();
  const { isLoaded, isSignedIn } = useAuth();

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
      {Platform.OS !== "web" && (
        <StatusBar
          style={isDark ? "light" : "dark"}
        />
      )}
      <Slot />
    </SettingsProvider>
  );
}

export default function AdminLayout() {
  return (
    <ThemeProvider>
      <ThemedAdmin />
    </ThemeProvider>
  );
}
