import React, { useMemo } from "react";

import { StyleSheet } from "react-native";

import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";
import {
  SlidingToggle,
} from "@/components/ui/SlidingToggle";

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
    <SlidingToggle<ToggleOption>
      value={value}
      onChange={onChange}
      style={styles.shellColors}
      options={[
        {
          value: "All",
          label: "All",
          activeColor: colors.primary,
          accessibilityLabel:
            "Show all appliances",
        },
        {
          value: "Advisable",
          label: "Advisable",
          activeColor: colors.primary,
          accessibilityLabel:
            "Show advisable appliances",
        },
        {
          value: "notAdvisable",
          label: "Not Advisable",
          activeColor: colors.error,
          accessibilityLabel:
            "Show not advisable appliances",
        },
      ]}
    />
  );
}

// ============================================================
// STYLES
// ============================================================

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
  shellColors: {
    width: "100%",
    backgroundColor: colors.glass.white,
    borderColor: colors.border,
    borderRadius: 14,
    marginTop: 10,
  },
});