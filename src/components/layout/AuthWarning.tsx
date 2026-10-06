import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import AppText from "@/components/ui/AppText";
import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";

// ============================================================
// AUTH WARNING
//
// Single shared error row for login + register + forgot-
// password. Left-aligned icon + text so all screens present
// identical states. Rendered below the primary button with
// a close 6px gap; returns null when there is no message so
// no space is reserved (buttons sit tight under fields).
// ============================================================

interface AuthWarningProps {
  message: string;
}

export default function AuthWarning({
  message,
}: AuthWarningProps) {
  const colors = useAppColors();

  const styles = useMemo(
    () => getStyles(colors),
    [colors],
  );

  if (!message) {
    return null;
  }

  return (
    <View
      style={styles.container}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Ionicons
        name="warning-outline"
        size={20}
        color={colors.errorDeep}
        style={styles.icon}
      />

      <AppText
        variant="caption"
        style={styles.text}
      >
        {message}
      </AppText>
    </View>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 6,
    marginBottom: 6,
  },

  icon: {
    marginRight: 8,
    marginTop: 1,
  },

  text: {
    flex: 1,
    color: colors.errorDeep,
  },
});
