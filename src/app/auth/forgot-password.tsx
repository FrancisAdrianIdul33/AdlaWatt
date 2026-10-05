import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import AppInput from "@/components/ui/AppInput";
import Copyright from "@/components/ui/Copyright";
import PasswordInput from "@/components/ui/PasswordInput";
import AuthFooter from "@/components/layout/AuthFooter";
import AuthHeader from "@/components/layout/AuthHeader";
import AuthLogo from "@/components/layout/AuthLogo";
import AuthWarning from "@/components/layout/AuthWarning";
import ScreenContainer from "@/components/layout/ScreenContainer";
import AppButton from "@/components/ui/AppButton";
import AppText from "@/components/ui/AppText";
import { Routes } from "@/constants/routes";
import { Spacing } from "@/constants/theme";
import { EMAIL_PATTERN } from "@/services/auth";
import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";

// ============================================================
// FORGOT PASSWORD (UI-ONLY)
//
// Same shell as login/register: AuthLogo + AuthHeader +
// form + AuthFooter + Copyright. No auth wiring yet — all
// buttons are placeholders. Progressive disclosure:
// email always; check-email card after Send; set-new-
// password when ?verified=1 (stands in for the callback
// redirect until the function phase).
// ============================================================

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [warning, setWarning] = useState("");
  const [updateWarning, setUpdateWarning] = useState("");
  const [sent, setSent] = useState(false);

  const { verified: verifiedParam } = useLocalSearchParams<{
    verified?: string;
  }>();
  const isVerified = verifiedParam === "1";
  const showCard = sent || isVerified;

  const newPasswordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const colors = useAppColors();
  const mailStyles = useMemo(
    () => mailCardStyles(colors),
    [colors],
  );
  const previewStyles = useMemo(
    () => previewSectionStyles(),
    [],
  );

  // ── UI-only validation (mirrors login/register guards) ──
  const handleSend = () => {
    setWarning("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setWarning("Please enter your email address.");
      return;
    }

    if (!EMAIL_PATTERN.test(cleanEmail)) {
      setWarning("Please enter a valid email address.");
      return;
    }

    setSent(true);
    // TODO Forgot Password (function phase): requestPasswordReset(email).
  };

  const handleResend = () => {
    // TODO Forgot Password (function phase): resend with 60s cooldown.
  };

  const handleUpdate = () => {
    setUpdateWarning("");

    if (!newPassword || newPassword.trim().length < 8) {
      setUpdateWarning("Password must be at least 8 characters.");
      return;
    }

    if (newPassword.length > 72) {
      setUpdateWarning("Password must not exceed 72 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setUpdateWarning(
        "Passwords do not match. Please check both password fields.",
      );
      return;
    }

    // TODO Forgot Password (function phase): updateRecoveryPassword().
  };

  const handleBackToSignIn = () => {
    router.replace(Routes.LOGIN);
  };

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <AuthLogo />

        <AuthHeader
          title="Reset Password"
          subtitle="Enter your account email. We'll send you a recovery link."
        />

        <View style={styles.form}>
          {/* ── STATE A: email request ── */}
          <AppInput
            label="Email Address"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setWarning("");
            }}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            returnKeyType="done"
            onSubmitEditing={handleSend}
            bottomGap={0}
          />

          <AppButton
            title="Send Recovery Link"
            onPress={handleSend}
          />

          <AuthWarning message={warning} />

          {/* ── STATE B: check-email card, appears after Send ── */}
          {showCard ? (
          <View
            style={mailStyles.card}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            accessibilityLabel="Recovery email sent"
          >
            <View style={mailStyles.headerPanel}>
              <View style={mailStyles.headerLeft}>
                <Ionicons
                  name="mail-unread-outline"
                  size={22}
                  color={colors.headerContent}
                />

                <AppText style={mailStyles.headerTitle}>
                  Check Your Email
                </AppText>
              </View>

              <View style={mailStyles.sentPill}>
                <AppText style={mailStyles.sentPillText}>
                  • Sent
                </AppText>
              </View>
            </View>

            <View style={mailStyles.body}>
              <View style={mailStyles.toRow}>
                <AppText style={mailStyles.toLabel}>
                  To:
                </AppText>

                <View style={mailStyles.emailChip}>
                  <AppText
                    style={mailStyles.emailChipText}
                    numberOfLines={1}
                  >
                    {email || "your inbox"}
                  </AppText>
                </View>
              </View>

              <AppText style={mailStyles.bodyText}>
                We sent a recovery link. Tap it, then
                set a new password.
              </AppText>

              <AppButton
                title="Resend in 60s"
                onPress={handleResend}
                disabled
              />

              <AppText style={mailStyles.status}>
                Didn&apos;t get it? Check spam or try
                a different address.
              </AppText>
            </View>
          </View>
          ) : null}

          {/* ── STATE C: set new password, appears when verified ── */}
          {isVerified ? (
          <View style={previewStyles.section}>
          <PasswordInput
            label="New Password"
            value={newPassword}
            onChangeText={(text) => {
              setNewPassword(text);
              setUpdateWarning("");
            }}
            placeholder="Create a new password"
            autoComplete="password-new"
            returnKeyType="next"
            onSubmitEditing={() =>
              confirmPasswordRef.current?.focus()
            }
            inputRef={newPasswordRef}
          />

          <PasswordInput
            label="Confirm New Password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setUpdateWarning("");
            }}
            placeholder="Confirm your new password"
            autoComplete="password-new"
            returnKeyType="done"
            onSubmitEditing={handleUpdate}
            inputRef={confirmPasswordRef}
            bottomGap={0}
          />

          <AppButton
            title="Update Password"
            onPress={handleUpdate}
          />

          <AuthWarning message={updateWarning} />
          </View>
          ) : null}
        </View>

        <AuthFooter
          prompt="Remembered your password?"
          actionLabel="Back to Sign In"
          onAction={handleBackToSignIn}
        />

        <Copyright />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-start",
  },

  form: {
    width: "100%",
  },
});

const previewSectionStyles = () =>
  StyleSheet.create({
    section: {
      marginTop: Spacing.lg,
    },
  });

const mailCardStyles = (colors: AppColors) =>
  StyleSheet.create({
    card: {
      width: "100%",
      backgroundColor: colors.glass.white,
      borderWidth: 3,
      borderColor: colors.cardBorder,
      borderRadius: 15,
      overflow: "hidden",
      marginTop: Spacing.md,
    },

    headerPanel: {
      width: "100%",
      backgroundColor: colors.headerBackground,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 14,
      paddingVertical: 9,
    },

    headerLeft: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      minWidth: 0,
    },

    headerTitle: {
      color: colors.headerContent,
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 8,
      flexShrink: 1,
    },

    sentPill: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.headerContent,
      paddingHorizontal: 10,
      paddingVertical: 4,
      marginLeft: 8,
    },

    sentPillText: {
      color: colors.headerContent,
      fontSize: 12,
      fontWeight: "700",
    },

    body: {
      padding: 14,
    },

    toRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      marginBottom: Spacing.sm,
    },

    toLabel: {
      color: colors.textSecondary,
    },

    emailChip: {
      flex: 1,
      minWidth: 0,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },

    emailChipText: {
      fontWeight: "700",
    },

    bodyText: {
      marginBottom: Spacing.xs,
    },

    status: {
      marginTop: Spacing.sm,
      color: colors.textSecondary,
    },
  });
