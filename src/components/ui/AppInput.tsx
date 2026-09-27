import React, { useMemo, type Ref } from "react";
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";
import AppText from "@/components/ui/AppText";
import { useTypography } from "@/hooks/useTypography";

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  inputRef?: Ref<TextInput>;
}

export default function AppInput({
  label,
  error,
  style,
  inputRef,
  ...props
}: AppInputProps) {
  const { scaledSize, family, weight } =
    useTypography();

  const colors = useAppColors();

  const styles = useMemo(
    () => getStyles(colors),
    [colors],
  );

  return (
    <View style={styles.container}>
      {label && (
        <AppText variant="body" style={styles.label}>
          {label}
        </AppText>
      )}

      <TextInput
        {...props}
        ref={inputRef}
        allowFontScaling={false}
        placeholderTextColor={colors.textSecondary}
        style={[
          styles.input,
          {
            fontSize: scaledSize(16),
            fontFamily: family,
            fontWeight: weight,
          },
          error ? styles.inputError : null,
          style,
        ]}
      />

      {error && (
        <AppText variant="caption" style={styles.error}>
          {error}
        </AppText>
      )}
    </View>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
  container: {
    marginBottom: 18,
  },

  label: {
    marginBottom: 8,
    fontWeight: "600",
  },

input: {
  backgroundColor: colors.surface,
  color: colors.textSecondary,

  borderWidth: 1,
  borderColor: colors.border,

  borderRadius: 12,

  paddingHorizontal: 16,
  paddingVertical: 14,

  fontSize: 16,
},

  inputError: {
    borderColor: colors.error,
  },

  error: {
    marginTop: 6,
    color: colors.error,
  },
});