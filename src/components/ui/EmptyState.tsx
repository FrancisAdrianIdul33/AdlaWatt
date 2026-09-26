import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import AppText from "@/components/ui/AppText";
import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";


interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export default function EmptyState({
  title = "No Activity Logs",
  description = "No activities match the selected filters.",
  icon = "document-text-outline",
}: EmptyStateProps) {
  const colors = useAppColors();
  const styles = useMemo(
    () => getStyles(colors),
    [colors],
  );
  return (
    <View style={styles.container}>
      <Ionicons
        name={icon}
        size={42}
        color={colors.textSecondary}
      />

      <AppText
        variant="body"
        style={styles.title}
      >
        {title}
      </AppText>

      <AppText
        variant="caption"
        style={styles.description}
      >
        {description}
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