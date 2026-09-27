import { Slot } from "expo-router";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";

import { ThemeProvider } from "@/context/ThemeContext";
import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";
import { useAppFonts } from "@/hooks/useAppFonts";

// ============================================================
// AUTH LAYOUT
//
// Gates login + register on bundled font load so the auth
// screens always render Inter (the app default, same as the
// dashboard) even when opened directly via deep link or
// fast refresh without passing through splash. Auth screens
// intentionally mount no SettingsProvider: they fall back to
// DEFAULT_TYPOGRAPHY (Inter).
//
// Theme follows the saved preference (same storage key as
// the dashboard instance) so auth greens match the
// dashboard buttons in both light and dark mode. Auth never
// writes the theme; the toggle lives in dashboard Menu.
// ============================================================

export default function AuthLayout() {
  return (
    <ThemeProvider>
      <ThemedAuth />
    </ThemeProvider>
  );
}

function ThemedAuth() {
  const fontsLoaded = useAppFonts();
  const colors = useAppColors();

  const styles = useMemo(
    () => getStyles(colors),
    [colors],
  );

  if (!fontsLoaded) {
    return (
      <View style={styles.fallback}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />
      </View>
    );
  }

  return <Slot />;
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    fallback: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
    },
  });
