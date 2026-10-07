import { router } from "expo-router";
import { useEffect, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import { Routes } from "@/constants/routes";
import { getCurrentUserProfile } from "@/services/auth";

// ============================================================
// useAdminGuard (role-based)
//
// Real check against self-readable users.role: admin renders,
// household bounces to /dashboard, signed-out to /login.
// Unknown/error roles fall back to household (never fail open).
// ============================================================

export function useAdminGuard() {
  const { isLoaded, isSignedIn } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleLoaded, setRoleLoaded] = useState(false);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      setIsAdmin(false);
      setRoleLoaded(true);
      router.replace(Routes.LOGIN);
      return;
    }

    let cancelled = false;
    setRoleLoaded(false);

    void (async () => {
      try {
        const profile = await getCurrentUserProfile();
        const admin =
          profile.success &&
          (profile as { role?: unknown }).role === "admin";

        if (cancelled) {
          return;
        }

        setIsAdmin(admin);
        setRoleLoaded(true);

        if (!admin) {
          router.replace(Routes.DASHBOARD);
        }
      } catch {
        if (cancelled) {
          return;
        }

        setIsAdmin(false);
        setRoleLoaded(true);
        router.replace(Routes.DASHBOARD);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn]);

  return {
    isLoaded,
    isSignedIn,
    isAdmin,
    // Render gate: wait for auth + role, require admin.
    canRender: isLoaded && isSignedIn && roleLoaded && isAdmin,
  };
}
