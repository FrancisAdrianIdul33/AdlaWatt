import { router } from "expo-router";
import { useEffect } from "react";

import { useAuth } from "@/context/AuthContext";
import { Routes } from "@/constants/routes";

// ============================================================
// useAdminGuard (UI-first)
//
// MOCK: always allows signed-in users through so the admin UI
// can be built and previewed now. Phase 2 replaces MOCK_ADMIN
// with users.role === "admin" from getCurrentUserProfile() and
// redirects household users to Routes.DASHBOARD.
// ============================================================

const MOCK_ADMIN = true;

export function useAdminGuard() {
  const { isLoaded, isSignedIn } = useAuth();

  const isAdmin = MOCK_ADMIN;

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      router.replace(Routes.LOGIN);
      return;
    }

    if (!isAdmin) {
      router.replace(Routes.DASHBOARD);
    }
  }, [isLoaded, isSignedIn, isAdmin]);

  return {
    isLoaded,
    isSignedIn,
    isAdmin,
    // Render gate for the screen: wait for auth, require admin.
    canRender: isLoaded && isSignedIn && isAdmin,
  };
}
