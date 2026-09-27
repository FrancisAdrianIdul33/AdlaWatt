import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  ViewStyle,
} from "react-native";

import AppText from "@/components/ui/AppText";

import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";
import { Radius } from "@/constants/theme";
import { Control } from "@/constants/sizing";

type AppButton1Props = {
  title: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
};

export default function AppButton1({
  title,
  onPress,
  icon = "arrow-forward",
  style,
}: AppButton1Props) {
  const colors = useAppColors();
  const styles = useMemo(
    () => getStyles(colors),
    [colors],
  );
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        style,
      ]}
    >
      <AppText
        variant="caption"
        style={styles.text}
      >
        {title}
      </AppText>

      <Ionicons
        name={icon}
        size={16}
        color={colors.onPrimary}
      />
    </Pressable>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    button: {
      width: "100%",
      maxWidth: 360,
      minHeight: Control.button,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.primary,
      borderRadius: Radius.md,
      marginTop: Control.buttonGap,
      marginBottom: 15,
    },

    text: {
      color: colors.onPrimary,
      fontSize: 14,
      fontWeight: "700",
    },

    pressed: {
      opacity: 0.7,
    },
  });