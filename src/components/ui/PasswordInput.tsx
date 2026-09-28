import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState, type Ref } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

import AppText from "@/components/ui/AppText";
import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";
import { Field, Touch } from "@/constants/sizing";
import { useTypography } from "@/hooks/useTypography";

interface PasswordInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  returnKeyType?: TextInputProps["returnKeyType"];
  onSubmitEditing?: TextInputProps["onSubmitEditing"];
  autoComplete?: TextInputProps["autoComplete"];
  inputRef?: Ref<TextInput>;
}

// ============================================================
// PASSWORD INPUT
//
// Mirrors AppInput visuals (label, field, error) but owns its
// TextInput so the eye toggle can center on the field itself.
// The old fixed `top: 42` anchored the icon to the whole
// container (label + input), so label height or font scaling
// pushed it off-center. The toggle now stretches the field
// height (`top: 0, bottom: 0`) with centered content.
// ============================================================

export default function PasswordInput({
  label = "Password",
  value,
  onChangeText,
  placeholder = "Enter your password",
  error,
  returnKeyType,
  onSubmitEditing,
  autoComplete,
  inputRef,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const { scaledSize, family, weight } =
    useTypography();

  const colors = useAppColors();

  const styles = useMemo(
    () => getStyles(colors),
    [colors],
  );

  return (
    <View style={styles.container}>
      <AppText variant="body" style={styles.label}>
        {label}
      </AppText>

      <View style={styles.field}>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          allowFontScaling={false}
          placeholderTextColor={colors.textSecondary}
          autoComplete={autoComplete}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          style={[
            styles.input,
            {
              fontSize: scaledSize(16),
              fontFamily: family,
              fontWeight: weight,
            },
            error ? styles.inputError : null,
          ]}
        />

        <Pressable
          style={styles.toggle}
          onPress={() =>
            setShowPassword((previous) => !previous)
          }
          accessibilityRole="button"
          accessibilityLabel={
            showPassword
              ? "Hide password"
              : "Show password"
          }
          hitSlop={8}
        >
          <Ionicons
            name={
              showPassword
                ? "eye-off-outline"
                : "eye-outline"
            }
            size={22}
            color={colors.textSecondary}
          />
        </Pressable>
      </View>

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
      marginBottom: Field.fieldGap,
    },

    label: {
      marginBottom: Field.labelGap,
      fontSize: 14,
      fontWeight: "600",
    },

    field: {
      position: "relative",
      justifyContent: "center",
    },

    input: {
      backgroundColor: colors.surface,
      color: colors.textSecondary,

      borderWidth: 1,
      borderColor: colors.border,

      borderRadius: 12,

      minHeight: Field.height,
      paddingHorizontal: Field.padding,
      paddingVertical: 14,
      paddingRight: 52,

      fontSize: Field.textSize,
    },

    inputError: {
      borderColor: colors.error,
    },

    toggle: {
      position: "absolute",
      right: 4,
      top: 0,
      bottom: 0,
      width: Touch.target,
      alignItems: "center",
      justifyContent: "center",
    },

    error: {
      marginTop: 6,
      color: colors.error,
    },
  });
