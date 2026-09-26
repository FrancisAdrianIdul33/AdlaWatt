import React, { useMemo } from "react";
import {
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

import AppText from "@/components/ui/AppText";
import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";
import { Spacing } from "@/constants/theme";

interface CopyrightProps {
  style?: StyleProp<ViewStyle>;
}

export default function Copyright({ style }: CopyrightProps) {
  const colors = useAppColors();
  const styles = useMemo(
    () => getStyles(colors),
    [colors],
  );
  return (
    <View style={[styles.container, style]}>
      <AppText
        variant="caption"
        style={styles.text}
      >
        © 2026 AdlaWatt
      </AppText>
    </View>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      alignItems: "center",
      marginTop: "auto",
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.sm,
    },

    text: {
      color: colors.textSecondary,
      textAlign: "center",
    },
  });