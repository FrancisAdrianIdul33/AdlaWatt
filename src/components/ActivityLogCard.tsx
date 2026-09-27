import { Ionicons } from "@expo/vector-icons";

import React, { useMemo } from "react";

import {
  StyleSheet,
  View,
} from "react-native";

import AppText from "@/components/ui/AppText";

import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";

// ============================================================
// ACTIVITY LOG CARD
//
// Single shared log card used by both the dashboard "Recent
// Activity" block and the dedicated activity logs screen so
// every log entry looks and arranges the same way.
// ============================================================

export type ActivityLogType =
  | "info"
  | "warning"
  | "error"
  | "critical";

export type ActivityLogItem = {
  id: string;
  type: ActivityLogType;
  title: string;
  details: string;
  date: string;
  time: string;
};

export const ACTIVITY_LOG_GAP = 12;

function getActivityIcon(
  type: ActivityLogType,
): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case "info":
      return "information-circle-outline";

    case "warning":
      return "warning-outline";

    case "error":
    case "critical":
      return "alert-circle-outline";

    default:
      return "information-circle-outline";
  }
}

function getActivityColor(
  type: ActivityLogType,
  colors: AppColors,
): string {
  switch (type) {
    case "info":
      return colors.primary;

    case "warning":
      return colors.secondary;

    case "error":
    case "critical":
      return colors.error;

    default:
      return colors.primary;
  }
}

export default function ActivityLogCard({
  item,
}: {
  item: ActivityLogItem;
}) {
  const colors = useAppColors();

  const styles = useMemo(
    () => getStyles(colors),
    [colors],
  );

  const color = getActivityColor(item.type, colors);

  return (
    <View style={styles.card}>
      <View style={styles.wrapper}>
        <Ionicons
          name={getActivityIcon(item.type)}
          size={24}
          color={color}
        />

        <View style={styles.content}>
          <AppText
            variant="body"
            style={styles.title}
          >
            {item.title}
          </AppText>

          <AppText
            variant="caption"
            style={styles.details}
          >
            {item.details}
          </AppText>

          <AppText
            variant="caption"
            style={styles.timestamp}
          >
            {item.date} • {item.time}
          </AppText>
        </View>
      </View>
    </View>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: colors.glass.white,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 12,
  },

  wrapper: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  content: {
    flex: 1,
  },

  title: {
    color: colors.text,
    fontWeight: "700",
  },

  details: {
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 18,
  },

  timestamp: {
    color: colors.textSecondary,
    marginTop: 5,
    fontSize: 12,
  },
});