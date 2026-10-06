import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Pressable,
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
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  EMAIL_PATTERN,
  requestPasswordReset,
  updateRecoveryPassword,
} from "@/services/auth";
import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";

// ============================================================
// FORGOT PASSWORD (SELF-CONTAINED RECOVERY)
// ============================================================
//
// Same shell as login/register: AuthLogo + AuthHeader +
// form + AuthFooter + Copyright. Recovery links land here
// directly (see getRecoveryRedirectTo) and this screen
// exchanges the link's PKCE code — or verifies its
// token_hash — itself, so no callback UI ever appears.
//
// Phases inside one morphing card:
//   request   → email form + Send (always visible until
//               the email is confirmed)
//   sent      → "Check Your Email" + resend
//   verifying → spinner while the link is exchanged
//   verified  → success copy + [Continue to Account] with
//               an opt-in password-change expander below
//   linkError → error copy + resend (reuses the sent card)
// ============================================================

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [warning, setWarning] = useState("");
  const [updateWarning, setUpdateWarning] = useState("");
  const [linkWarning, setLinkWarning] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [resending, setResending] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showChangeForm, setShowChangeForm] =
    useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const params = useLocalSearchParams<{
    code?: string | string[];
    token_hash?: string | string[];
    type?: string | string[];
    error?: string | string[];
    error_description?: string | string[];
  }>();

  // A live recovery session is the source of truth for
  // "email confirmed": the PASSWORD_RECOVERY event sets it
  // after this screen exchanges the link itself, or when an
  // old callback-routed link lands here already verified.
  const { isRecoverySession, clearRecoverySession } =
    useAuth();
  const isVerified = isRecoverySession;
  const showCard =
    sent ||
    verifying ||
    isVerified ||
    linkWarning !== "";

  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setResendCooldown((value) => Math.max(0, value - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const firstParam = (
    value: string | string[] | undefined,
  ): string => {
    if (typeof value === "string") {
      return value;
    }

    if (Array.isArray(value) && value.length > 0) {
      return value[0] ?? "";
    }

    return "";
  };

  const decodeLinkParam = (value: string): string => {
    try {
      return decodeURIComponent(value.replace(/\+/g, " "));
    } catch {
      return value;
    }
  };

  // Single-shot guard: dev StrictMode re-runs effects and
  // the auth code is single-use — a second exchange would
  // burn a confusing "expired" error over a success.
  const exchangeAttempted = useRef(false);

  // ── In-screen link verification (no callback UI) ──
  useEffect(() => {
    let cancelled = false;

    const verifyLink = async () => {
      const code = firstParam(params.code);
      const tokenHash = firstParam(params.token_hash);
      const otpType = firstParam(params.type);
      const linkError = firstParam(params.error);
      const linkErrorDescription = firstParam(
        params.error_description,
      );

      if (!code && !tokenHash && !linkError) {
        return;
      }

      if (exchangeAttempted.current) {
        return;
      }

      exchangeAttempted.current = true;

      if (linkError) {
        if (!cancelled) {
          setLinkWarning(
            linkErrorDescription
              ? decodeLinkParam(linkErrorDescription)
              : "This recovery link is invalid or has expired. Request a new one below.",
          );
        }
        return;
      }

      if (tokenHash && otpType && otpType !== "recovery") {
        if (!cancelled) {
          setLinkWarning(
            "This link is not a password recovery link. Request a new recovery email below.",
          );
        }
        return;
      }

      setVerifying(true);
      setLinkWarning("");

      if (code) {
        const { error } =
          await supabase.auth.exchangeCodeForSession(code);

        if (!cancelled) {
          setVerifying(false);

          if (error) {
            setLinkWarning(
              "This recovery link is invalid or has expired. Request a new one below.",
            );
          }
          // Success path needs no local state: the
          // PASSWORD_RECOVERY event flips
          // isRecoverySession, revealing the verified card.
        }
        return;
      }

      // Legacy token-hash links.
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "recovery",
      });

      if (!cancelled) {
        setVerifying(false);

        if (error) {
          setLinkWarning(
            "This recovery link is invalid or has expired. Request a new one below.",
          );
        }
      }
    };

    void verifyLink();

    return () => {
      cancelled = true;
    };
  }, [
    params.code,
    params.token_hash,
    params.type,
    params.error,
    params.error_description,
  ]);

  const newPasswordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const colors = useAppColors();
  const mailStyles = useMemo(
    () => mailCardStyles(colors),
    [colors],
  );

  // ── Validation mirrors login/register guards; the
  // service re-validates so direct callers get the same ──
  const handleSend = async () => {
    if (sending) {
      return;
    }

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

    try {
      setSending(true);

      const result = await requestPasswordReset(cleanEmail);

      if (!result.success) {
        setWarning(
          result.error ??
            "Unable to send a recovery email right now. Please try again.",
        );
        return;
      }

      setSent(true);
      setResendCooldown(60);
    } catch {
      setWarning(
        "Something went wrong. Please try again.",
      );
    } finally {
      setSending(false);
    }
  };

  const handleResend = async () => {
    if (resending || resendCooldown > 0) {
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !EMAIL_PATTERN.test(cleanEmail)) {
      return;
    }

    try {
      setResending(true);

      const result =
        await requestPasswordReset(cleanEmail);

      if (result.throttled) {
        setResendCooldown(60);
      } else if (result.success) {
        setResendCooldown(60);
      } else {
        setWarning(
          result.error ??
            "Unable to send a recovery email right now. Please try again.",
        );
      }
    } finally {
      setResending(false);
    }
  };

  const handleUpdate = async () => {
    if (updating) {
      return;
    }

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

    try {
      setUpdating(true);

      const result =
        await updateRecoveryPassword(newPassword);

      if (!result.success) {
        setUpdateWarning(
          result.error ??
            "Unable to update your password right now. Please try again.",
        );
        return;
      }

      clearRecoverySession();
      router.replace(Routes.DASHBOARD);
    } catch {
      setUpdateWarning(
        "Something went wrong. Please try again.",
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleBackToSignIn = () => {
    router.replace(Routes.LOGIN);
  };

  // Verified user skips the password change: the recovery
  // session is a full session, so land on the dashboard as
  // a normal signed-in user.
  const handleContinue = () => {
    clearRecoverySession();
    router.replace(Routes.DASHBOARD);
  };

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <AuthLogo />

        <AuthHeader
          title="Reset Password"
          subtitle={
            isVerified
              ? "Your email is confirmed. Continue to your account or set a new password."
              : "Enter your account email. We'll send you a recovery link."
          }
        />

        <View style={styles.form}>
          {/* ── STATE A: email request (hidden once verified) ── */}
          {!isVerified ? (
          <>
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
            title={sending ? "Sending..." : "Send Recovery Link"}
            onPress={handleSend}
            disabled={sending}
          />

          <AuthWarning message={warning} />
          </>
          ) : null}

          {/* ── Card: sent / verifying / verified / linkError ── */}
          {showCard ? (
          <View
            style={mailStyles.card}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            accessibilityLabel={
              isVerified
                ? "Email confirmed"
                : verifying
                  ? "Verifying recovery link"
                  : "Recovery email sent"
            }
          >
            <View style={mailStyles.headerPanel}>
              <View style={mailStyles.headerLeft}>
                <Ionicons
                  name={
                    isVerified
                      ? "checkmark-circle-outline"
                      : verifying
                        ? "time-outline"
                        : "mail-unread-outline"
                  }
                  size={22}
                  color={colors.headerContent}
                />

                <AppText style={mailStyles.headerTitle}>
                  {verifying
                    ? "Verifying Link"
                    : isVerified
                      ? "Email Confirmed"
                      : "Check Your Email"}
                </AppText>
              </View>

              {!isVerified && !verifying && sent ? (
                <View style={mailStyles.sentPill}>
                  <AppText
                    style={mailStyles.sentPillText}
                  >
                    • Sent
                  </AppText>
                </View>
              ) : null}
            </View>

            <View style={mailStyles.body}>
              {verifying ? (
                <>
                  <ActivityIndicator
                    size="large"
                    color={colors.accentContent}
                  />

                  <AppText style={mailStyles.status}>
                    Verifying your recovery link…
                  </AppText>
                </>
              ) : isVerified ? (
                <>
                  <AppText style={mailStyles.bodyText}>
                    You have successfully confirmed
                    your email.
                  </AppText>

                  <AppButton
                    title="Continue to Account"
                    onPress={handleContinue}
                  />

                  <Pressable
                    onPress={() =>
                      setShowChangeForm(
                        (current) => !current,
                      )
                    }
                    style={mailStyles.changeToggle}
                    accessibilityRole="button"
                    accessibilityLabel={
                      showChangeForm
                        ? "Hide password change form"
                        : "Show password change form"
                    }
                    accessibilityHint="Reveals the new password fields"
                    hitSlop={8}
                  >
                    <AppText
                      style={
                        mailStyles.changeToggleText
                      }
                    >
                      {showChangeForm
                        ? "Hide password fields"
                        : "Or you want to change your password?"}
                    </AppText>
                  </Pressable>

                  {showChangeForm ? (
                    <View
                      style={mailStyles.changeSection}
                    >
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
                        title={
                          updating
                            ? "Updating..."
                            : "Update Password"
                        }
                        onPress={handleUpdate}
                        disabled={updating}
                      />

                      <AuthWarning
                        message={updateWarning}
                      />
                    </View>
                  ) : null}
                </>
              ) : (
                <>
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
                    We sent a recovery link. Tap it,
                    then set a new password.
                  </AppText>

                  {linkWarning ? (
                    <AuthWarning
                      message={linkWarning}
                    />
                  ) : null}

                  <AppButton
                    title={
                      resending
                        ? "Resending..."
                        : resendCooldown > 0
                          ? `Resend in ${resendCooldown}s`
                          : "Resend recovery email"
                    }
                    onPress={handleResend}
                    disabled={resending || resendCooldown > 0}
                  />

                  <AppText style={mailStyles.status}>
                    Didn&apos;t get it? Check spam or
                    try a different address.
                  </AppText>
                </>
              )}
            </View>
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

    changeToggle: {
      alignItems: "center",
      justifyContent: "center",
      minHeight: 40,
      marginTop: Spacing.xs,
      paddingHorizontal: 4,
    },

    changeToggleText: {
      color: colors.linkText,
      fontWeight: "600",
      textDecorationLine: "underline",
      textAlign: "center",
    },

    changeSection: {
      width: "100%",
      marginTop: Spacing.sm,
    },
  });
