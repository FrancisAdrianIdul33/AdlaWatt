import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import AppInput from "@/components/ui/AppInput";
import Copyright from "@/components/ui/Copyright";
import GoogleGIcon from "@/components/ui/GoogleGIcon";
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
import { Control } from "@/constants/sizing";
import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";

import { loginUser, resendConfirmation, signInWithGoogle } from "@/services/auth";

// Completes the pending auth session on Android when the
// in-app browser redirects back to adlawatt://auth/callback.
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [warning, setWarning] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [unconfirmedEmail, setUnconfirmedEmail] = useState("");
  const [confirmationResent, setConfirmationResent] = useState<
    "" | "sent" | "rate-limited" | "failed"
  >("");
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const colors = useAppColors();
  const noticeStyles = useMemo(
    () => mailCardStyles(colors),
    [colors],
  );
  const extraStyles = useMemo(
    () => loginExtraStyles(colors),
    [colors],
  );

  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setResendCooldown((value) => Math.max(0, value - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleResend = async () => {
    if (resending || resendCooldown > 0 || !unconfirmedEmail) {
      return;
    }

    setResending(true);

    try {
      const result = await resendConfirmation(unconfirmedEmail);

      if (result.success) {
        setConfirmationResent("sent");
        setResendCooldown(60);
      } else if (result.throttled) {
        setConfirmationResent("rate-limited");
        setResendCooldown(60);
      } else {
        setConfirmationResent("failed");
      }
    } finally {
      setResending(false);
    }
  };

  const passwordRef = useRef<TextInput>(null);

  const handleLogin = async () => {
  if (loading) {
    return;
  }

  setWarning("");

  const identifier = usernameOrEmail.trim();
  const cleanPassword = password;

  if (!identifier) {
    setWarning("Please enter your username or email.");
    return;
  }

  if (!cleanPassword) {
    setWarning("Please enter your password.");
    return;
  }

  if (identifier.includes("@")) {
    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(identifier)) {
      setWarning("Please enter a valid email address.");
      return;
    }
  } else if (identifier.length < 3) {
    setWarning("Username must be at least 3 characters.");
    return;
  }

  if (cleanPassword.length < 8) {
    setWarning("Password must be at least 8 characters.");
    return;
  }

  try {
    setLoading(true);

    const result = await loginUser(
      identifier,
      cleanPassword,
    );

    if (!result.success) {
  if (result.emailNotConfirmed) {
    setUnconfirmedEmail(result.email ?? "");

    const resent =
      (result.confirmationResent as
        | "sent"
        | "rate-limited"
        | "failed"
        | undefined) ?? "failed";

    setConfirmationResent(resent);

    if (resent === "sent") {
      setResendCooldown(60);
    }

    // Confirmation flow owns its messaging in the notice
    // card below Sign In; keep the red warning slot clear.
    setWarning("");
    return;
  }

  setUnconfirmedEmail("");
  setConfirmationResent("");

  setWarning(
    result.error ??
      "We could not sign you in. Please check your information and try again.",
  );
  return;
}

    setUnconfirmedEmail("");
    setConfirmationResent("");

    router.replace(Routes.DASHBOARD);
  } catch {
    setWarning(
      "Something went wrong. Please try again.",
    );
  } finally {
    setLoading(false);
  }
};

  const handleRegister = () => {
    router.push(Routes.REGISTER);
  };

  // ── Forgot password routes to its screen; Google uses
  // the Supabase OAuth provider (see services/auth). ──
  const handleForgotPassword = () => {
    router.push(Routes.FORGOT_PASSWORD);
  };

  const handleGoogleSignIn = async () => {
    if (loading || googleLoading) {
      return;
    }

    setWarning("");

    try {
      setGoogleLoading(true);

      const result = await signInWithGoogle();

      if (result.success) {
        // Web redirect unloads the page; native session is
        // already persisted. The auth layout notices the new
        // session and routes to the dashboard on its own —
        // replace explicitly in case the event lags.
        if (!("redirected" in result)) {
          router.replace(Routes.DASHBOARD);
        }
        return;
      }

      // Dismissed browser: stay on login silently.
      if ("cancelled" in result && result.cancelled) {
        return;
      }

      if ("redirected" in result && result.redirected) {
        return;
      }

      setWarning(
        ("error" in result && typeof result.error === "string" && result.error) ||
          "Google sign-in was not completed. Please try again.",
      );
    } catch {
      setWarning(
        "Google sign-in was not completed. Please try again.",
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <AuthLogo />

        <AuthHeader
          title="Welcome Back"
          subtitle="Sign in to continue using AdlaWatt."
        />

        <View style={styles.form}>
          <AppInput
            label="Username or Email"
            value={usernameOrEmail}
            onChangeText={setUsernameOrEmail}
            placeholder="Enter your username or email"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            returnKeyType="next"
            onSubmitEditing={() =>
              passwordRef.current?.focus()
            }
          />

          <PasswordInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            autoComplete="password"
            returnKeyType="done"
            onSubmitEditing={handleLogin}
            inputRef={passwordRef}
            bottomGap={0}
          />

          <View style={extraStyles.forgotRow}>
            <Pressable
              onPress={handleForgotPassword}
              style={extraStyles.forgotHit}
              accessibilityRole="link"
              accessibilityLabel="Forgot password"
              accessibilityHint="Recover your password via email"
              hitSlop={12}
            >
              <AppText style={extraStyles.forgotLink}>
                Forgot Password?
              </AppText>
            </Pressable>
          </View>

          <AppButton
            title={loading ? "Signing In..." : "Sign In"}
            onPress={handleLogin}
            disabled={loading}
          />

          <AuthWarning message={warning} />

          <View
            style={extraStyles.dividerRow}
            accessibilityRole="none"
          >
            <View style={extraStyles.dividerLine} />
            <AppText style={extraStyles.dividerText}>OR</AppText>
            <View style={extraStyles.dividerLine} />
          </View>

          <Pressable
            onPress={handleGoogleSignIn}
            disabled={loading || googleLoading}
            style={({ pressed }) => [
              extraStyles.googleButton,
              pressed && extraStyles.googlePressed,
              (loading || googleLoading) &&
                extraStyles.googlePressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
            accessibilityHint="Sign in with your Google account"
          >
            <GoogleGIcon size={20} />
            <AppText style={extraStyles.googleLabel}>
              {googleLoading
                ? "Connecting..."
                : "Continue with Google"}
            </AppText>
          </Pressable>

          {unconfirmedEmail ? (
            <View
              style={noticeStyles.card}
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
              accessibilityLabel="Email confirmation required"
            >
              <View style={noticeStyles.headerPanel}>
                <View style={noticeStyles.headerLeft}>
                  <Ionicons
                    name="mail-unread-outline"
                    size={22}
                    color={colors.headerContent}
                  />

                  <AppText
                    style={noticeStyles.headerTitle}
                  >
                    Verify Your Email
                  </AppText>
                </View>

                <View style={noticeStyles.sentPill}>
                  <AppText
                    style={noticeStyles.sentPillText}
                  >
                    • Sent
                  </AppText>
                </View>
              </View>

              <View style={noticeStyles.body}>
                <View style={noticeStyles.toRow}>
                  <AppText style={noticeStyles.toLabel}>
                    To:
                  </AppText>

                  <View style={noticeStyles.emailChip}>
                    <AppText
                      style={noticeStyles.emailChipText}
                      numberOfLines={1}
                    >
                      {unconfirmedEmail}
                    </AppText>
                  </View>
                </View>

                <AppText style={noticeStyles.bodyText}>
                  Your account needs verification
                  before you can sign in.
                </AppText>

                <AppText style={noticeStyles.status}>
                  {confirmationResent === "sent"
                    ? "We've just sent a fresh confirmation link. Check your inbox."
                    : confirmationResent === "rate-limited"
                      ? "A link was sent recently. Tap resend below if it hasn't arrived."
                      : "Tap resend below for a new confirmation link."}
                </AppText>

                <AppButton
                  title={
                    resending
                      ? "Resending..."
                      : resendCooldown > 0
                        ? `Resend in ${resendCooldown}s`
                        : "Resend confirmation email"
                  }
                  onPress={handleResend}
                  disabled={resending || resendCooldown > 0}
                />
              </View>
            </View>
          ) : null}
        </View>

        <AuthFooter
          prompt="Don't have an account?"
          actionLabel="Create Account"
          onAction={handleRegister}
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
      marginBottom: Spacing.sm,
      color: colors.textSecondary,
    },
  });

// ── Option B UI-only extras: Forgot Password + OR + Google ──
const loginExtraStyles = (colors: AppColors) =>
  StyleSheet.create({
    forgotRow: {
      width: "100%",
      alignItems: "flex-end",
      marginTop: 2,
      marginBottom: 14,
    },

    forgotHit: {
      minHeight: 32,
      justifyContent: "flex-start",
      paddingHorizontal: 4,
    },

    forgotLink: {
      color: colors.linkText,
      fontWeight: "600",
      textDecorationLine: "underline",
    },

    dividerRow: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      marginTop: Spacing.lg,
      marginBottom: Spacing.xs,
    },

    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },

    dividerText: {
      marginHorizontal: Spacing.sm,
      color: colors.textSecondary,
      fontWeight: "600",
    },

    googleButton: {
      width: "100%",
      minHeight: Control.button,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: Control.buttonPadding,
      marginTop: Control.buttonGap,
      gap: 10,
    },

    googlePressed: {
      opacity: 0.7,
    },

    googleLabel: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "600",
    },
  });