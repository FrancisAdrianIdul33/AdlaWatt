import { Ionicons } from "@expo/vector-icons";
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Ref,
} from "react";
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
  bottomGap?: number;
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
  bottomGap,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  // 5s visibility window: remaining seconds shown under
  // the field while the password is visible.
  const [remaining, setRemaining] = useState(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    if (tickTimer.current) {
      clearInterval(tickTimer.current);
      tickTimer.current = null;
    }
  };

  useEffect(() => clearTimers, []);

  const handleToggle = () => {
    if (showPassword) {
      clearTimers();
      setShowPassword(false);
      setRemaining(0);
      return;
    }

    setShowPassword(true);
    setRemaining(5);
    clearTimers();

    tickTimer.current = setInterval(() => {
      setRemaining((value) => Math.max(0, value - 1));
    }, 1000);

    hideTimer.current = setTimeout(() => {
      clearTimers();
      setShowPassword(false);
      setRemaining(0);
    }, 5000);
  };

  const { scaledSize, family, weight } =
    useTypography();

  const colors = useAppColors();

  const styles = useMemo(
    () => getStyles(colors, bottomGap),
    [colors, bottomGap],
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
          onPress={handleToggle}
          accessibilityRole="button"
          accessibilityLabel={
            showPassword
              ? `Hide password, auto-hides in ${remaining} seconds`
              : "Show password for 5 seconds"
          }
          accessibilityHint={
            showPassword
              ? "Password is visible and will hide automatically"
              : "Shows password for 5 seconds"
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

      {showPassword ? (
        <View
          accessibilityLiveRegion="polite"
          accessibilityLabel={`Password visible, hides in ${remaining} seconds`}
        >
          <AppText variant="caption" style={styles.hint}>
            Showing password… hides in {remaining}s
          </AppText>
          <View style={styles.timerTrack}>
            <View
              style={[
                styles.timerFill,
                { width: `${(remaining / 5) * 100}%` },
              ]}
            />
          </View>
        </View>
      ) : null}

      {error && (
        <AppText variant="caption" style={styles.error}>
          {error}
        </AppText>
      )}
    </View>
  );
}

const getStyles = (colors: AppColors, bottomGap?: number) =>
  StyleSheet.create({
    container: {
      marginBottom: bottomGap ?? Field.fieldGap,
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

    hint: {
      marginTop: 6,
      color: colors.textSecondary,
    },

    timerTrack: {
      marginTop: 6,
      height: 4,
      borderRadius: 999,
      backgroundColor: colors.border,
      overflow: "hidden",
    },

    timerFill: {
      height: 4,
      borderRadius: 999,
      backgroundColor: colors.primary,
    },
  });
