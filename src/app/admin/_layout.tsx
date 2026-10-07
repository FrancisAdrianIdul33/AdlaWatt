import { Slot, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import { useEffect } from "react";

import { useAuth } from "@/context/AuthContext";
import { useAdminGuard } from "@/admin/hooks/useAdminGuard";

// ============================================================
// ADMIN LAYOUT (admin-only, pinned light + default type)
//
// Deliberately WITHOUT ThemeProvider / SettingsProvider:
// household theme flips, font-size/family changes and
// language switches must never restyle admin. Missing
// providers fall back to the light palette + default
// typography, and StatusBar is fixed dark-on-light.
// Admin uses its own AdminScreenContainer + AdminNavBarBottom
// from src/admin/. Auth + role guard here (see
// useAdminGuard); the screen keeps its own gate as well.
// ============================================================

function ThemedAdmin() {
  const { isLoaded, isSignedIn } = useAuth();
  const { canRender: canRenderAdmin } = useAdminGuard();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/auth/login");
    }
  }, [isLoaded, isSignedIn]);

  if (!isLoaded || !isSignedIn || !canRenderAdmin) {
    return null;
  }

  return (
    <>
      {Platform.OS !== "web" && (
        <StatusBar style="dark" />
      )}
      <Slot />
    </>
  );
}

export default function AdminLayout() {
  return <ThemedAdmin />;
}
