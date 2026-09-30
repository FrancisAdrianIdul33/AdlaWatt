import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";

import { loginUser, resendConfirmation } from "@/services/auth";

export default function LoginScreen() {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [warning, setWarning] = useState("");
  const [loading, setLoading] = useState(false);

  const [unconfirmedEmail, setUnconfirmedEmail] = useState("");
  const [confirmationResent, setConfirmationResent] = useState<
    "" | "sent" | "rate-limited" | "failed"
  >("");
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const colors = useAppColors();
  const noticeStyles = noticeCardStyles(colors);

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
          />

          <AuthWarning message={warning} />

          <AppButton
            title={loading ? "Signing In..." : "Sign In"}
            onPress={handleLogin}
            disabled={loading}
          />

          {unconfirmedEmail ? (
            <View
              style={noticeStyles.card}
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
              accessibilityLabel="Email confirmation required"
            >
              <View style={noticeStyles.headerRow}>
                <Ionicons
                  name="mail-unread-outline"
                  size={20}
                  color={colors.primary}
                  style={noticeStyles.icon}
                />

                <AppText style={noticeStyles.title}>
                  Check your email
                </AppText>
              </View>

              <AppText style={noticeStyles.body}>
                Your account{" "}
                <AppText style={noticeStyles.email}>
                  {unconfirmedEmail}
                </AppText>{" "}
                needs verification before you can sign
                in.
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

const noticeCardStyles = (colors: AppColors) =>
  StyleSheet.create({
    card: {
      width: "100%",
      backgroundColor: colors.primaryWash,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: 12,
      padding: Spacing.md,
      marginTop: Spacing.md,
    },

    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: Spacing.xs,
    },

    icon: {
      marginRight: Spacing.sm,
    },

    title: {
      fontWeight: "700",
    },

    body: {
      marginBottom: Spacing.xs,
    },

    email: {
      fontWeight: "700",
    },

    status: {
      marginBottom: Spacing.sm,
    },
  });