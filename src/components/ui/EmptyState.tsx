import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";

import AppText from "@/components/ui/AppText";
import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";
import { useTranslation } from "react-i18next";


interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}

export default function EmptyState({
  title,
  description,
  icon = "document-text-outline",
  style,
}: EmptyStateProps) {
  const { t } = useTranslation();
  const colors = useAppColors();
  const resolvedTitle = title ?? t("shared.emptyTitle");
  const resolvedDescription =
    description ?? t("shared.emptyDescription");
  const styles = useMemo(
    () => getStyles(colors),
    [colors],
  );
  return (
    <View style={[styles.container, style]}>
      <Ionicons
        name={icon}
        size={42}
        color={colors.textSecondary}
      />

      <AppText
        variant="body"
        style={styles.title}
      >
        {resolvedTitle}
      </AppText>

      <AppText
        variant="caption"
        style={styles.description}
      >
        {resolvedDescription}
      </AppText>
    </View>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      width: "100%",
      height: "90%",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.glass.white,
      borderWidth: 3,
      borderColor: colors.border,
      borderRadius: 16,
      paddingVertical: 35,
      paddingHorizontal: 20,
    },

    title: {
      color: colors.text,
      fontWeight: "700",
      marginTop: 10,
    
    },

    description: {
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: 5,
    },
  });