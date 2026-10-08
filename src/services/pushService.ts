import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { router } from "expo-router";

import {
  getAuthenticatedUserSafe,
  supabase,
} from "@/lib/supabase";
import { Routes } from "@/constants/routes";

// ============================================================
// PUSH NOTIFICATIONS (Android via Expo Push Service)
// ============================================================
//
// Device-side companion to supabase/functions/send-push.
// Token flow:
//   sign-in  -> permission -> ExpoPushToken -> upsert row
//   sign-out -> delete row (before signOut, while authed)
// Physical devices only: emulators cannot receive pushes,
// so registration skips non-devices silently.
//
// Foreground behavior: banner + list + sound + badge, so a
// foreground alert looks the same as a background one. Taps
// deep-link to the Notifications screen.
// ============================================================

export const PUSH_CHANNEL_ID =
  "adlawatt-alerts";

export interface PushSendResult {
  success: boolean;
  error?: string;
}

// Foreground presentation. Set once at module load (idempotent
// — repeated setNotificationHandler calls just replace).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority:
      Notifications.AndroidNotificationPriority
        .HIGH,
  }),
});

const getProjectId = (): string | null => {
  const projectId =
    Constants.expoConfig?.extra?.eas
      ?.projectId ??
    Constants.easConfig?.projectId ??
    null;

  return typeof projectId === "string" &&
    projectId.length > 0
    ? projectId
    : null;
};

const ensureAndroidChannel =
  async (): Promise<void> => {
    if (Platform.OS !== "android") {
      return;
    }

    try {
      await Notifications.setNotificationChannelAsync(
        PUSH_CHANNEL_ID,
        {
          name: "AdlaWatt Alerts",
          importance:
            Notifications.AndroidImportance
              .HIGH,
          vibrationPattern: [0, 400, 2000],
          sound: "default",
          enableVibrate: true,
          showBadge: true,
        },
      );
    } catch (error) {
      console.warn(
        "Push channel setup failed:",
        error instanceof Error
          ? error.message
          : error,
      );
    }
  };

// Upserts this device's token for the signed-in user.
// Resolves null when registration is impossible (emulator,
// denied permission, signed out) — callers treat null as
// "no push for this device" without error surfaces.
export const registerPushToken =
  async (): Promise<string | null> => {
    try {
      if (!Device.isDevice) {
        console.debug(
          "Push skipped: not a physical device.",
        );

        return null;
      }

      const user =
        await getAuthenticatedUserSafe();

      if (!user) {
        return null;
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();

      const finalStatus =
        existingStatus === "granted"
          ? existingStatus
          : (
              await Notifications.requestPermissionsAsync()
            ).status;

      if (finalStatus !== "granted") {
        console.debug(
          "Push skipped: permission not granted.",
        );

        return null;
      }

      const projectId = getProjectId();

      if (!projectId) {
        console.warn(
          "Push skipped: no EAS project ID.",
        );

        return null;
      }

      await ensureAndroidChannel();

      const tokenResponse =
        await Notifications.getExpoPushTokenAsync(
          { projectId },
        );

      const token = tokenResponse.data;

      if (!token) {
        return null;
      }

      const { error } = await supabase
        .from("push_tokens")
        .upsert(
          {
            user_id: user.id,
            expo_push_token: token,
            platform: Platform.OS,
            updated_at:
              new Date().toISOString(),
          },
          {
            onConflict:
              "user_id,expo_push_token",
          },
        );

      if (error) {
        console.warn(
          "Push token save failed:",
          error.message,
        );

        return null;
      }

      console.log(
        "Push token registered.",
      );

      return token;
    } catch (error) {
      console.warn(
        "Push registration failed:",
        error instanceof Error
          ? error.message
          : error,
      );

      return null;
    }
  };

// Deletes this device's token. Must run BEFORE signOut while
// the session still satisfies RLS (same ordering rule as the
// logout activity log).
export const unregisterPushToken =
  async (): Promise<void> => {
    try {
      const user =
        await getAuthenticatedUserSafe();

      if (!user) {
        return;
      }

      if (!Device.isDevice) {
        return;
      }

      const projectId = getProjectId();

      if (!projectId) {
        return;
      }

      let token: string | null = null;

      try {
        const tokenResponse =
          await Notifications.getExpoPushTokenAsync(
            { projectId },
          );

        token = tokenResponse.data ?? null;
      } catch {
        token = null;
      }

      if (!token) {
        return;
      }

      const { error } = await supabase
        .from("push_tokens")
        .delete()
        .eq("user_id", user.id)
        .eq("expo_push_token", token);

      if (error) {
        console.warn(
          "Push token removal failed:",
          error.message,
        );
      }
    } catch (error) {
      console.warn(
        "Push unregister failed:",
        error instanceof Error
          ? error.message
          : error,
      );
    }
  };

// ------------------------------------------------------------
// TAP DEEP-LINK (Notifications screen)
// ------------------------------------------------------------

export const addPushResponseListener =
  (): (() => void) => {
    const subscription =
      Notifications.addNotificationResponseReceivedListener(
        () => {
          try {
            router.push(
              Routes.NOTIFICATIONS,
            );
          } catch (error) {
            console.warn(
              "Push deep-link failed:",
              error instanceof Error
                ? error.message
                : error,
            );
          }
        },
      );

    return () => subscription.remove();
  };

// ============================================================
// SEND (client -> Edge Function, key never leaves server)
// ============================================================

export interface PushSendOptions {
  title: string;
  body: string;
  route?: string;
}

export const sendPushNotification = async ({
  title,
  body,
  route = Routes.NOTIFICATIONS,
}: PushSendOptions): Promise<PushSendResult> => {
  try {
    const { data, error } =
      await supabase.functions.invoke(
        "send-push",
        {
          body: { title, body, route },
        },
      );

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    const ok =
      (data as { success?: unknown } | null)
        ?.success === true;

    if (!ok) {
      const serverError = (
        data as { error?: unknown } | null
      )?.error;

      return {
        success: false,
        error:
          typeof serverError === "string" &&
          serverError.length > 0
            ? serverError
            : "Push service did not accept the send.",
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to send push.",
    };
  }
};
