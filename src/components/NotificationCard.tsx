import { Ionicons } from "@expo/vector-icons";

import React, { useMemo } from "react";

import { StyleSheet, View } from "react-native";

import AppText from "@/components/ui/AppText";

import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";

export type NotificationType =
  "normal" | "alert";

export interface NotificationCardData {
  id: string;
  title: string;
  message: string;
  date: string;
  time: string;
  type: NotificationType;
  isRead: boolean;
}

interface NotificationCardProps {
  notification?: NotificationCardData | null;
}

export default function NotificationCard({
  notification,
}: NotificationCardProps) {
  const colors = useAppColors();

  const styles = useMemo(
    () => getStyles(colors),
    [colors],
  );

  const safeNotification: NotificationCardData =
    notification ?? {
      id: "unknown",
      title: "Notification",
      message:
        "No notification details available.",
      date: "",
      time: "",
      type: "normal",
      isRead: true,
    };

  const isAlert =
    safeNotification.type === "alert";

  const iconName: keyof typeof Ionicons.glyphMap =
    isAlert
      ? "alert-circle-outline"
      : "notifications-outline";

  // Themed inks: alert rides error, normal rides the
  // monochrome/green accent so it stays legible on the
  // themed card surface in both modes.
  const iconColor = isAlert
    ? colors.error
    : colors.accentContent;

  const typeLabel = isAlert ? "Alert" : "Normal";

  return (
    <View style={styles.stackContainer}>
      {/* Back layer: solid type color peeked on the left */}
      <View
        pointerEvents="none"
        accessible={false}
        style={[
          styles.backLayer,
          {
            backgroundColor: isAlert
              ? colors.error
              : colors.accentContent,
          },
        ]}
      />

      <View
        style={[
          styles.notificationCard,
          {
            borderColor: isAlert
              ? colors.error
              : colors.accentContent,
          },
          !safeNotification.isRead &&
            styles.unreadNotification,
        ]}
      >
      <View style={styles.notificationWrapper}>
        {/* Notification Icon */}
        <Ionicons
          name={iconName}
          size={24}
          color={iconColor}
        />

        {/* Notification Content */}
        <View style={styles.notificationContent}>
          <View style={styles.titleRow}>
            <AppText
              variant="body"
              style={styles.notificationTitle}
            >
              {safeNotification.title}
            </AppText>

            {/* Persistent type label: status is never
                color-alone (Normal / Alert). */}
            <View
              style={[
                styles.typePill,
                isAlert
                  ? styles.typePillAlert
                  : styles.typePillNormal,
              ]}
              accessibilityRole="text"
              accessibilityLabel={`Type ${typeLabel}`}
            >
              <AppText
                variant="caption"
                style={[
                  styles.typePillText,
                  isAlert
                    ? styles.typePillTextAlert
                    : styles.typePillTextNormal,
                ]}
              >
                {typeLabel}
              </AppText>
            </View>
          </View>

          <AppText
            variant="caption"
            style={styles.notificationMessage}
          >
            {safeNotification.message}
          </AppText>

          <View style={styles.divider} />

          <AppText
            variant="caption"
            style={styles.notificationTimestamp}
          >
            {safeNotification.date}
            {safeNotification.date &&
            safeNotification.time
              ? " • "
              : ""}
            {safeNotification.time}
          </AppText>
        </View>
      </View>
      </View>
    </View>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
  stackContainer: {
    width: "100%",
    position: "relative",
    paddingLeft: 6,
  },

  backLayer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
    borderRadius: 16,
  },

  notificationCard: {
    width: "100%",
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    overflow: "hidden",
  },

  unreadNotification: {
    backgroundColor:
      colors.primaryWash,
  },

  notificationWrapper: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  notificationContent: {
    flex: 1,
  },

  notificationTitle: {
    color: colors.text,
    fontWeight: "700",
    flex: 1,
    flexShrink: 1,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  typePill: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  typePillAlert: {
    backgroundColor: colors.error,
  },

  typePillNormal: {
    backgroundColor: colors.primary,
  },

  typePillText: {
    fontSize: 12,
    fontWeight: "700",
  },

  typePillTextAlert: {
    color: colors.onPrimary,
  },

  typePillTextNormal: {
    color: colors.onPrimary,
  },

  notificationMessage: {
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 18,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },

  notificationTimestamp: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});