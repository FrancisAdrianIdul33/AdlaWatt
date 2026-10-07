import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  StyleSheet,
  View,
} from "react-native";

import AppButton from "@/components/ui/AppButton";
import AppText from "@/components/ui/AppText";
import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";
import { useTranslation } from "react-i18next";

// ============================================================
// ERROR STATE
//
// Shared load-failure panel for data screens: icon, message,
// and a 48px retry action. Announced to screen readers so a
// failed fetch is never mistaken for empty data.
// ============================================================

interface ErrorStateProps {
  message?: string;
  onRetry: () => void;
}

export default function ErrorState({
  message,
  onRetry,
}: ErrorStateProps) {
  const { t } = useTranslation();
  const colors = useAppColors();
  const resolvedMessage = message ?? t("common.wentWrong");

  const styles = useMemo(
    () => getStyles(colors),
    [colors],
  );

  return (
    <View
      style={styles.container}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Ionicons
        name="cloud-offline-outline"
        size={48}
        color={colors.textSecondary}
      />

      <AppText
        variant="heading"
        style={styles.title}
      >
        {t("shared.errorTitle")}
      </AppText>

      <AppText
        variant="caption"
        style={styles.message}
      >
        {resolvedMessage}
      </AppText>

      <View style={styles.action}>
        <AppButton
          title={t("shared.retry")}
          onPress={onRetry}
        />
      </View>
    </View>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 40,
      paddingHorizontal: 24,
    },

    title: {
      textAlign: "center",
      marginTop: 16,
    },

    message: {
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: 8,
      lineHeight: 20,
    },

    action: {
      width: "100%",
      marginTop: 16,
    },
  });
