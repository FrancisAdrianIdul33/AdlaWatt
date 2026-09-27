import React, { useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  ViewStyle,
} from "react-native";

import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";
import AppText from "./AppText";

interface AppButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export default function AppButton({
  title,
  onPress,
  disabled = false,
  style,
}: AppButtonProps) {
  const colors = useAppColors();

  const styles = useMemo(
    () => getStyles(colors),
    [colors],
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <AppText variant="button">
        {title}
      </AppText>
    </Pressable>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    marginTop: 15,
    borderRadius: 12,
    paddingVertical: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  disabled: {
    opacity: 0.5,
  },

  pressed: {
    opacity: 0.85,
  },
});