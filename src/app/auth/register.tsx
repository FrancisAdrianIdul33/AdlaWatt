import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import AppInput from "@/components/ui/AppInput";
import PasswordInput from "@/components/ui/PasswordInput";
import TermsModal from "@/components/forms/TermsModal";
import AuthFooter from "@/components/layout/AuthFooter";
import AuthHeader from "@/components/layout/AuthHeader";
import AuthLogo from "@/components/layout/AuthLogo";
import AuthWarning from "@/components/layout/AuthWarning";
import ScreenContainer from "@/components/layout/ScreenContainer";
import AppButton from "@/components/ui/AppButton";
import AppText from "@/components/ui/AppText";
import { DropdownModal } from "@/components/ui/DropdownModal";
import { Ionicons } from "@expo/vector-icons";
import { useAppColors } from "@/hooks/useAppColors";
import { Routes } from "@/constants/routes";
import { Spacing } from "@/constants/theme";
import Copyright from "@/components/ui/Copyright";

import {
  EMAIL_PATTERN,
  registerUser,
  resendConfirmation,
} from "@/services/auth";

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [termsModalVisible, setTermsModalVisible] =
    useState(false);

  const [termsAgreed, setTermsAgreed] =
    useState(false);

  const [warning, setWarning] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [confirmationPending, setConfirmationPending] =
    useState(false);

  const [confirmationEmail, setConfirmationEmail] =
    useState("");

  const [resending, setResending] = useState(false);

  const [resendCooldown, setResendCooldown] = useState(0);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef =
    useRef<TextInput>(null);

  const colors = useAppColors();

  const showWarning = (message: string) => {
    setWarning(message);
  };

  const validateForm = () => {
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanUsername) {
      showWarning("Please enter a username.");
      return false;
    }

    if (cleanUsername.length < 3) {
      showWarning(
        "Username must be at least 3 characters."
      );
      return false;
    }

    if (cleanUsername.length > 30) {
      showWarning(
        "Username must not exceed 30 characters."
      );
      return false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      showWarning(
        "Username can only contain letters, numbers, and underscores."
      );
      return false;
    }

    if (!cleanEmail) {
      showWarning("Please enter your email address.");
      return false;
    }

    if (
      !EMAIL_PATTERN.test(
        cleanEmail
      )
    ) {
      showWarning(
        "Please enter a valid email address."
      );
      return false;
    }

    if (!password || password.trim().length < 8) {
      showWarning(
        "Password must be at least 8 characters."
      );
      return false;
    }

    if (password.length > 72) {
      showWarning(
        "Password must not exceed 72 characters."
      );
      return false;
    }

    if (password !== confirmPassword) {
      showWarning(
        "Passwords do not match. Please check both password fields."
      );
      return false;
    }

    if (!termsAgreed) {
      showWarning(
        "Please agree to the Terms and Conditions before creating your account."
      );
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (loading) {
      return;
    }

    setWarning("");

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const result = await registerUser(
        username,
        email,
        password,
        termsAgreed
      );

      if (!result.success) {
        showWarning(result.error ?? "Unable to create your account.");
        return;
      }

      if (result.needsConfirmation) {
        setWarning("");
        setConfirmationEmail(result.email ?? email.trim().toLowerCase());
        setConfirmationPending(true);
        return;
      }

      setWarning("");

      // Confirm-off projects hand back a live session, so
      // skip login and go straight to the dashboard.
      router.replace(Routes.DASHBOARD);
    } catch (error) {
      showWarning(
        error instanceof Error
          ? error.message
          : "Unable to create your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    router.replace(Routes.LOGIN);
  };

  const handleTermsAgree = () => {
    setTermsAgreed(true);
    setTermsModalVisible(false);
    setWarning("");
  };

  const toggleTerms = () => {
    if (termsAgreed) {
      setTermsAgreed(false);
      setWarning("");
    } else {
      setTermsModalVisible(true);
    }
  };

  const openTerms = () => {
    setTermsModalVisible(true);
  };

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
    if (resending || resendCooldown > 0 || !confirmationEmail) {
      return;
    }

    setResending(true);
    setWarning("");

    try {
      const result = await resendConfirmation(confirmationEmail);

      if (!result.success) {
        showWarning(result.error ?? "Unable to resend confirmation email.");

        if (result.throttled) {
          setResendCooldown(60);
        }

        return;
      }

      setResendCooldown(60);
    } finally {
      setResending(false);
    }
  };

  const handleEditEmail = () => {
    setConfirmationPending(false);
    setConfirmationEmail("");
    setWarning("");
    emailRef.current?.focus();
  };

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <AuthLogo />

        <AuthHeader
          title="Create Account"
          subtitle="Create your AdlaWatt account to start monitoring your energy."
        />

        <View style={styles.form}>
          <AppInput
            label="Username"
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              setWarning("");
            }}
            placeholder="Enter your username"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            returnKeyType="next"
            onSubmitEditing={() =>
              emailRef.current?.focus()
            }
          />

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
            returnKeyType="next"
            onSubmitEditing={() =>
              passwordRef.current?.focus()
            }
            inputRef={emailRef}
          />

          <PasswordInput
            label="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setWarning("");
            }}
            placeholder="Create a password"
            autoComplete="password-new"
            returnKeyType="next"
            onSubmitEditing={() =>
              confirmPasswordRef.current?.focus()
            }
            inputRef={passwordRef}
          />

          <PasswordInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setWarning("");
            }}
            placeholder="Confirm your password"
            autoComplete="password-new"
            returnKeyType="done"
            onSubmitEditing={handleRegister}
            inputRef={confirmPasswordRef}
          />

          <View style={styles.termsRow}>
            <Pressable
              onPress={toggleTerms}
              style={styles.checkboxHit}
              accessibilityRole="checkbox"
              accessibilityState={{
                checked: termsAgreed,
              }}
              accessibilityLabel="Agree to Terms and Conditions"
              hitSlop={8}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor:
                      colors.primary,
                    backgroundColor:
                      termsAgreed
                        ? colors.primary
                        : colors.surface,
                  },
                ]}
              >
                {termsAgreed && (
                  <AppText
                    style={[
                      styles.checkmark,
                      {
                        color:
                          colors.onPrimary,
                      },
                    ]}
                  >
                    ✓
                  </AppText>
                )}
              </View>
            </Pressable>

            <AppText style={styles.termsText}>
              <AppText onPress={toggleTerms}>
                I agree to the{" "}
              </AppText>
              <AppText
                style={[
                  styles.termsLink,
                  {
                    color: colors.linkText,
                  },
                ]}
                onPress={openTerms}
                accessibilityRole="link"
                accessibilityLabel="Open Terms and Conditions"
              >
                Terms and Conditions
              </AppText>
            </AppText>
          </View>

          <AppButton
            title={
              loading
                ? "Creating Account..."
                : "Create Account"
            }
            onPress={handleRegister}
            disabled={loading}
            style={styles.createButton}
          />

          <AuthWarning message={warning} />

          <DropdownModal
            visible={confirmationPending}
            title="Check your email"
            showCloseButton={false}
            dismissOnOverlayPress={false}
            onClose={() => {}}
          >
            <View style={styles.confirmationBody}>
              <View
                style={styles.mailIconWrap}
              >
                <Ionicons
                  name="mail-outline"
                  size={48}
                  color={colors.primary}
                />
              </View>

              <AppText
                style={styles.confirmationText}
              >
                We sent a confirmation link to{" "}
                {confirmationEmail}. Click the link to
                verify your account, then sign in.
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
                style={styles.createButton}
              />

              <AppButton
                title="Continue to Sign In"
                onPress={handleLogin}
                style={styles.createButton}
              />

              <Pressable
                onPress={handleEditEmail}
                style={styles.editEmailButton}
                accessibilityRole="button"
                accessibilityLabel="Use a different email address"
              >
                <AppText
                  style={[
                    styles.editEmailText,
                    {
                      color: colors.linkText,
                    },
                  ]}
                >
                  Use a different email address
                </AppText>
              </Pressable>
            </View>
          </DropdownModal>
        </View>

        <AuthFooter
          prompt="Already have an account?"
          actionLabel="Sign In"
          onAction={handleLogin}
        />

        <Copyright />
      </View>

      <TermsModal
        visible={termsModalVisible}
        onClose={() =>
          setTermsModalVisible(false)
        }
        onAgree={handleTermsAgree}
      />
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

  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },

  checkboxHit: {
    paddingVertical: 8,
    paddingRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1.5,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },

  checkmark: {
    fontSize: 14,
    fontWeight: "700",
  },

  termsText: {
    flex: 1,
    flexWrap: "wrap",
  },

  termsLink: {
    fontWeight: "600",
    textDecorationLine: "underline",
  },

  createButton: {
    marginTop: Spacing.sm,
  },

  confirmationBody: {
    width: "100%",
    alignItems: "center",
  },

  mailIconWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    marginBottom: Spacing.sm,
  },

  confirmationText: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },

  editEmailButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    marginTop: Spacing.xs,
  },

  editEmailText: {
    fontWeight: "600",
    textDecorationLine: "underline",
    textAlign: "center",
  },
});