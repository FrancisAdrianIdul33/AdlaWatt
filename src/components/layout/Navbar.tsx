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
  View,
} from "react-native";

import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";

import { Routes } from "@/constants/routes";

import { supabase } from "@/lib/supabase";

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
        const {
          data: { user },
        } = await supabase.auth.getUser();

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

    return () => {
      mounted = false;
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

  const navBarStyles = useMemo(
    () => getNavBarStyles(colors),
    [colors],
  );

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <View
      style={
        navBarStyles.wrapper
      }
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
              color={colors.onPrimary}
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
  height: 72,
  horizontalPadding: 16,
  iconButtonWidth: 42,
  iconButtonHeight: 42,
  notificationIconSize: 27,
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
    backgroundColor: colors.primary,
  },

  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
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
    backgroundColor: colors.secondary,
  },

  // Device status capsule
  deviceStatus: {
    width: navBarDimensions.deviceStatusWidth,
    height: navBarDimensions.deviceStatusHeight,
    borderRadius: navBarDimensions.deviceStatusRadius,
    backgroundColor: colors.background,
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
    backgroundColor: colors.primary,
  },

  offlineDot: {
    backgroundColor: colors.error,
  },

  statusText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
});