import React, { useMemo } from "react";

import {
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import AppText from "@/components/ui/AppText";

import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";

// ============================================================
// TYPES
// ============================================================

export type ToggleOption =
  | "All"
  | "Advisable"
  | "notAdvisable";

interface ToggleProps {
  value: ToggleOption;
  onChange: (option: ToggleOption) => void;
}

// ============================================================
// TOGGLE COMPONENT
// ============================================================

export default function Toggle({
  value,
  onChange,
}: ToggleProps) {
  const colors = useAppColors();

  const styles = useMemo(
    () => getStyles(colors),
    [colors],
  );

  return (
    <View style={styles.statusToggle}>
      {(
        [
          "All",
          "Advisable",
          "notAdvisable",
        ] as ToggleOption[]
      ).map((option) => (
        <Pressable
          key={option}
          onPress={() =>
            onChange(option)
          }
          style={({ pressed }) => [
            styles.statusButton,
            value === option && {
              backgroundColor:
                option === "Advisable"
                  ? colors.primary
                  : option === "notAdvisable"
                    ? colors.error
                    : colors.primary,
            },
            pressed && styles.pressed,
          ]}
        >
          <AppText
            variant="caption"
            style={[
              styles.statusText,
              value === option &&
                styles.activeStatusText,
            ]}
          >
            {option === "notAdvisable"
              ? "Not Advisable"
              : option}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
  statusToggle: {
    width: "100%",
    flexDirection: "row",
    backgroundColor: colors.glass.white,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 3,
    marginTop: 10,
  },

  statusButton: {
    flex: 1,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
  },

  statusText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },

  activeStatusText: {
    color: colors.onPrimary,
  },

  pressed: {
    opacity: 0.7,
  },
});