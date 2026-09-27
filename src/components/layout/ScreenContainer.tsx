import React, { ReactNode, useMemo } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";

import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";
import { useScreenPadding } from "@/constants/sizing";

interface ScreenContainerProps {
  children: ReactNode;
  scrollable?: boolean;
}

// Auth-only container. Intentionally no SettingsProvider:
// auth screens always use DEFAULT_TYPOGRAPHY.
// Follows the saved theme (provided by auth/_layout) so
// auth greens match the dashboard buttons in both modes.
// Content is centered in a max-width column so phones use
// full width while tablets / web stay a readable 480px.

export default function ScreenContainer({
  children,
  scrollable = true,
}: ScreenContainerProps) {
  const padding = useScreenPadding();

  const colors = useAppColors();

  const styles = useMemo(
    () => getStyles(colors),
    [colors],
  );

  const content = scrollable ? (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        { paddingHorizontal: padding },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.authColumn}>{children}</View>
    </ScrollView>
  ) : (
    <View style={styles.authColumn}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollContent: {
    flexGrow: 1,
    paddingVertical: 24,
  },

  authColumn: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    flexGrow: 1,
  },
});