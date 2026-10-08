import { useEffect, useRef } from "react";

import { useAuth } from "@/context/AuthContext";
import {
  addPushResponseListener,
  registerPushToken,
} from "@/services/pushService";

// ============================================================
// USE PUSH NOTIFICATIONS
// ============================================================
//
// Mount once per signed-in dashboard (dashboard layout,
// next to useAlertVibration). On sign-in: registers this
// device's ExpoPushToken (permission prompt included —
// first grant asks once, later sign-ins reuse silently).
// Tap on any AdlaWatt push deep-links to Notifications.
// Unregistering happens explicitly in the logout handlers
// (before signOut, while RLS still passes) — not here,
// because by unmount the session is already gone.
// Failures stay silent: push is ambience, never an error
// surface.
// ============================================================

export function usePushNotifications(): void {
  const { isSignedIn, user } = useAuth();
  const userId = user?.id ?? null;
  const registeredUserId = useRef<
    string | null
  >(null);

  useEffect(() => {
    if (!isSignedIn || !userId) {
      registeredUserId.current = null;

      return;
    }

    if (registeredUserId.current === userId) {
      return;
    }

    registeredUserId.current = userId;

    // Staggered like the notification service init so the
    // permission prompt never races first paint.
    const timer = setTimeout(() => {
      void registerPushToken().catch(
        () => {},
      );
    }, 1500);

    const removeListener =
      addPushResponseListener();

    return () => {
      clearTimeout(timer);
      removeListener();
    };
  }, [isSignedIn, userId]);
}
