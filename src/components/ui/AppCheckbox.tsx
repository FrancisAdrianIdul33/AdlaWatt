import React, { useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";
import { Touch } from "@/constants/sizing";
import AppText from "@/components/ui/AppText";

interface AppCheckboxProps {
  label: string;
  checked: boolean;
  onPress: () => void;
}

export default function AppCheckbox({
  label,
  checked,
  onPress,
}: AppCheckboxProps) {
  const colors = useAppColors();

  const styles = useMemo(
    () => getStyles(colors),
    [colors],
  );

  return (
    <Pressable
      style={styles.container}
      onPress={onPress}
    >
      <View
        style={[
          styles.checkbox,
          checked && styles.checked,
        ]}
      >
        {checked && (
          <AppText
            style={styles.checkmark}
          >
            ✓
          </AppText>
        )}
      </View>

      <AppText>
        {label}
      </AppText>
    </Pressable>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
    minHeight: Touch.target,
  },

  checkbox: {
    width: 24,
    height: 24,

    borderWidth: 1.5,
    borderColor: colors.primary,

    borderRadius: 6,

    justifyContent: "center",
    alignItems: "center",

    marginRight: 12,

    backgroundColor: colors.surface,
  },

  checked: {
    backgroundColor: colors.primary,
  },

  checkmark: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
});