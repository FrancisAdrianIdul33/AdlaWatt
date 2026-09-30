import { Ionicons } from "@expo/vector-icons";

import { router } from "expo-router";

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";

import { Routes } from "@/constants/routes";
import { Bar, Touch } from "@/constants/sizing";

import { getAuthenticatedUserSafe, supabase } from "@/lib/supabase";

import AppText from "@/components/ui/AppText";

import type { DeviceStatus } from "@/services/monitoringService";

// ============================================================
// NAVBAR PROPS
// ============================================================

interface NavBarProps {
  onNotificationPress?: () => void;
  deviceStatus?: DeviceStatus;
}

// ============================================================
// NAVBAR
// ============================================================

export default function NavBar({
  onNotificationPress,
  deviceStatus = "Offline",
}: NavBarProps) {
  const [
    hasUnreadNotifications,
    setHasUnreadNotifications,
  ] = useState(false);

  // ==========================================================
  // CHECK FOR UNREAD NOTIFICATIONS
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    const checkUnreadNotifications =
      async () => {
        const user = await getAuthenticatedUserSafe();

        if (!mounted) {
          return;
        }

        if (!user) {
          setHasUnreadNotifications(false);
          return;
        }

        const {
          data,
          error,
        } = await supabase
          .from("notifications")
          .select("notif_id")
          .eq("user_id", user.id)
          .eq("read", false)
          .limit(1);

        if (!mounted) {
          return;
        }

        if (error) {
          console.error(
            "Error checking unread notifications:",
            error,
          );

          return;
        }

        setHasUnreadNotifications(
          (data?.length ?? 0) > 0,
        );
      };

    checkUnreadNotifications();

    // Live badge: any insert/update/delete on the user's
    // notifications re-runs the check, so the dot clears
    // right after mark-as-read and lights on new arrivals
    // without waiting for a remount.
    //
    // Stable channel per user (no Date.now) so StrictMode
    // remounts reuse instead of leaking duplicates on the
    // shared websocket (previously socket 1006 on login).
    // Transient CHANNEL_ERROR/TIMED_OUT (e.g. 1006 on
    // localhost) warns + retries with backoff, max 3.
    let channel:
      | ReturnType<typeof supabase.channel>
      | null = null;

    let retryCount = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null =
      null;

    const subscribeNavbar = (
      userId: string,
    ): void => {
      if (!mounted) {
        return;
      }

      // Reuse an already-subscribed channel for this user.
      const existing = supabase
        .getChannels()
        .find(
          (c) =>
            (c as unknown as { topic?: string }).topic ===
            `realtime:navbar-notifications-${userId}`,
        );

      if (existing) {
        channel =
          existing as unknown as typeof channel;
        return;
      }

      const nextChannel = supabase
        .channel(`navbar-notifications-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          () => {
            if (mounted) {
              checkUnreadNotifications();
            }
          },
        )
        .subscribe((status, error) => {
          if (!mounted) {
            return;
          }

          if (
            status === "CHANNEL_ERROR" ||
            status === "TIMED_OUT"
          ) {
            console.warn(
              "Navbar notifications channel issue, retrying:",
              status,
              error instanceof Error
                ? error.message
                : error,
            );

            if (retryCount < 3) {
              const delay =
                [1000, 2000, 5000][retryCount] ?? 5000;
              retryCount += 1;

              retryTimer = setTimeout(() => {
                if (!mounted) {
                  return;
                }

                supabase
                  .removeChannel(nextChannel)
                  .catch(() => {});

                if (channel === nextChannel) {
                  channel = null;
                }

                subscribeNavbar(userId);
              }, delay);
            }

            return;
          }

          if (status === "SUBSCRIBED") {
            retryCount = 0;
          }
        });

      channel = nextChannel;
    };

    getAuthenticatedUserSafe()
      .then((user) => {
        if (!mounted || !user) {
          return;
        }

        subscribeNavbar(user.id);
      })
      .catch(() => {});

    return () => {
      mounted = false;

      if (retryTimer) {
        clearTimeout(retryTimer);
      }

      // Covers channels assigned after cleanup started:
      // remove by stable topic as well as by instance.
      const stale = channel;

      getAuthenticatedUserSafe()
        .then((user) => {
          if (stale) {
            supabase.removeChannel(stale).catch(() => {});
          }

          if (user) {
            const leaked = supabase
              .getChannels()
              .find(
                (c) =>
                  (c as unknown as { topic?: string })
                    .topic ===
                  `realtime:navbar-notifications-${user.id}`,
              );

            if (leaked && leaked !== stale) {
              supabase
                .removeChannel(
                  leaked as unknown as NonNullable<
                    typeof channel
                  >,
                )
                .catch(() => {});
            }
          }
        })
        .catch(() => {
          if (stale) {
            supabase.removeChannel(stale).catch(() => {});
          }
        });
    };
  }, []);

  // ==========================================================
  // HANDLE NOTIFICATION PRESS
  // ==========================================================

  const handleNotificationPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
      return;
    }

    router.push(
      Routes.NOTIFICATIONS,
    );
  };

  // ==========================================================
  // DEVICE STATUS
  // ==========================================================

  const isOnline =
    deviceStatus === "Online";

  const colors = useAppColors();

  // Viewport width so the bar background spans edge to
  // edge like NavBarBottom, even though NavBar renders
  // inside ScreenContainer2's maxWidth 768 column.
  // Inner container is untouched.
  const { width: screenWidth } =
    useWindowDimensions();

  const navBarStyles = useMemo(
    () => getNavBarStyles(colors),
    [colors],
  );

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <View
      style={[
        navBarStyles.wrapper,
        {
          width: screenWidth,
          alignSelf: "center",
        },
      ]}
    >
      <View
        style={
          navBarStyles.container
        }
      >
        {/* ====================================================
            DEVICE STATUS
            ==================================================== */}

        <View
          style={
            navBarStyles.deviceStatus
          }
        >
          <View
            style={[
              navBarStyles.statusDot,
              isOnline
                ? navBarStyles.onlineDot
                : navBarStyles.offlineDot,
            ]}
          />

          <AppText
            variant="caption"
            style={
              navBarStyles.statusText
            }
          >
            {deviceStatus}
          </AppText>
        </View>

        {/* ====================================================
            RIGHT-SIDE ACTIONS
            ==================================================== */}

        <View
          style={
            navBarStyles.actions
          }
        >
          {/* ==================================================
              NOTIFICATION
              ================================================== */}

          <Pressable
            onPress={
              handleNotificationPress
            }
            style={
              navBarStyles.iconButton
            }
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Ionicons
              name="notifications-outline"
              size={
                navBarDimensions.notificationIconSize
              }
              color={colors.bar.text}
            />

            {hasUnreadNotifications && (
              <View
                style={
                  navBarStyles.notificationDot
                }
              />
            )}
          </Pressable>
        </View>
      </View>

      {/* ======================================================
          SECONDARY ACCENT LINE
          ====================================================== */}

      <View
        style={
          navBarStyles.accentLine
        }
      />
    </View>
  );
}

const navBarDimensions = {
  height: Bar.appBar,
  horizontalPadding: 16,
  iconButtonWidth: Touch.target,
  iconButtonHeight: Touch.target,
  notificationIconSize: Touch.icon,
  notificationDotSize: 8,
  accentHeight: 3,

  // Device status capsule
  deviceStatusWidth: 80,
  deviceStatusHeight: 29,
  deviceStatusRadius: 20,
  statusDotSize: 9,
  statusDotMargin: 8,
};
const getNavBarStyles = (colors: AppColors) =>
  StyleSheet.create({
  wrapper: {
    width: "100%",
    zIndex: 100,
    elevation: 8,
    boxShadow: "0px 2px 4px rgba(0,0,0,0.12)",
  },

  container: {
    height: navBarDimensions.height,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // ← changed
    paddingHorizontal:
      navBarDimensions.horizontalPadding,
    backgroundColor: colors.bar.background,
  },

  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  iconButton: {
    width: navBarDimensions.iconButtonWidth,
    height: navBarDimensions.iconButtonHeight,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  notificationDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: navBarDimensions.notificationDotSize,
    height: navBarDimensions.notificationDotSize,
    borderRadius:
      navBarDimensions.notificationDotSize / 2,
    backgroundColor: colors.error,
  },

  accentLine: {
    width: "100%",
    height: navBarDimensions.accentHeight,
    backgroundColor: colors.bar.accent,
  },

  // Device status capsule
  deviceStatus: {
    width: navBarDimensions.deviceStatusWidth,
    height: navBarDimensions.deviceStatusHeight,
    borderRadius: navBarDimensions.deviceStatusRadius,
    backgroundColor: colors.bar.capsule,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  statusDot: {
    width: navBarDimensions.statusDotSize,
    height: navBarDimensions.statusDotSize,
    borderRadius: navBarDimensions.statusDotSize / 2,
    marginRight: navBarDimensions.statusDotMargin,
  },

  onlineDot: {
    backgroundColor: colors.bar.online,
  },

  offlineDot: {
    backgroundColor: colors.error,
  },

  statusText: {
    // Theme text (not bar.text): light #1C1B1F on cream
    // capsule for legibility; dark stays #E3E3E3.
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
});