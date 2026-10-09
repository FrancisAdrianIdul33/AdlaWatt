import { useEffect, useRef } from "react";

import { useAuth } from "@/context/AuthContext";
import {
  addReminderResponseListener,
  ensureEveningReminder,
} from "@/services/reminderService";

// ============================================================
// USE LOCAL REMINDERS
// ============================================================
//
// Mount once per signed-in dashboard (dashboard layout).
// On sign-in: ensures tonight's evening review schedule
// (idempotent — same identifier never stacks). Tap handling
// for reminder banners is wired here for the whole session.
// Sign-out cleanup (cancel) lives in the logout handlers,
// where it runs before signOut like the token removal did.
// Failures stay silent: reminders are ambience, never an
// error surface.
// ============================================================

export function useLocalReminders(): void {
  const { isSignedIn, user } = useAuth();
  const userId = user?.id ?? null;
  const ensuredUserId = useRef<string | null>(
    null,
  );

  useEffect(() => {
    if (!isSignedIn || !userId) {
      ensuredUserId.current = null;

      return;
    }

    if (ensuredUserId.current === userId) {
      return;
    }

    ensuredUserId.current = userId;

    const timer = setTimeout(() => {
      void ensureEveningReminder().catch(
        () => {},
      );
    }, 1500);

    const removeListener =
      addReminderResponseListener();

    return () => {
      clearTimeout(timer);
      removeListener();
    };
  }, [isSignedIn, userId]);
}
