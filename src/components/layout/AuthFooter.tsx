import React, { useMemo } from "react";
import { Pressable, StyleSheet } from "react-native";
import { Touch } from "@/constants/sizing";

import AppText from "@/components/ui/AppText";
import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";

// ============================================================
// AUTH FOOTER
//
// Single shared switcher row for login + register
// ("Don't have an account? Create Account" /
// "Already have an account? Sign In"). Centered, full-width,
// 44px minimum touch target with link semantics.
// ============================================================

interface AuthFooterProps {
  prompt: string;
  actionLabel: string;
  onAction: () => void;
}

export default function AuthFooter({
  prompt,
  actionLabel,
  onAction,
}: AuthFooterProps) {
  const colors = useAppColors();

  const styles = useMemo(
    () => getStyles(colors),
    [colors],
  );

  return (
    <Pressable
      onPress={onAction}
      style={styles.container}
      accessibilityRole="link"
      accessibilityLabel={`${prompt} ${actionLabel}`}
      hitSlop={12}
    >
      <AppText
        variant="caption"
        style={styles.prompt}
      >
        {prompt}
      </AppText>

      <AppText
        variant="body"
        style={styles.action}
      >
        {actionLabel}
      </AppText>
    </Pressable>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    minHeight: Touch.target,
    marginTop: 28,
  },

  prompt: {
    textAlign: "center",
  },

  action: {
    color: colors.linkText,
    fontWeight: "600",
    marginTop: 6,
    textAlign: "center",
    textDecorationLine: "underline",
  },
});
