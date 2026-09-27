import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import AppCheckbox from "@/components/ui/AppCheckbox";
import AppInput from "@/components/ui/AppInput";
import PasswordInput from "@/components/ui/PasswordInput";
import TermsModal from "@/components/forms/TermsModal";
import AuthHeader from "@/components/layout/AuthHeader";
import ScreenContainer from "@/components/layout/ScreenContainer";
import AppButton from "@/components/ui/AppButton";
import AppLogo from "@/components/ui/AppLogo";
import AppText from "@/components/ui/AppText";
import { Colors } from "@/constants/colors";
import { Routes } from "@/constants/routes";
import { Radius, Spacing } from "@/constants/theme";
import Copyright from "@/components/ui/Copyright";

import { registerUser } from "@/services/auth";

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
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        cleanEmail
      )
    ) {
      showWarning(
        "Please enter a valid email address."
      );
      return false;
    }

    if (!password) {
      showWarning("Please create a password.");
      return false;
    }

    if (password.length < 8) {
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

      setWarning("");

      router.replace(Routes.LOGIN);
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

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <AppLogo
          width={350}
          height={180}
        />

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
          />

          <PasswordInput
            label="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setWarning("");
            }}
            placeholder="Create a password"
          />

          <PasswordInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setWarning("");
            }}
            placeholder="Confirm your password"
          />

          <View style={styles.termsRow}>
            <AppCheckbox
              label="I agree to the Terms and Conditions"
              checked={termsAgreed}
              onPress={() => {
                if (termsAgreed) {
                  setTermsAgreed(false);
                  setWarning("");
                } else {
                  setTermsModalVisible(true);
                }
              }}
            />

            <Pressable
              onPress={() =>
                setTermsModalVisible(true)
              }
              style={styles.termsIconButton}
              accessibilityRole="button"
              accessibilityLabel="Open Terms and Conditions"
            >
              <Ionicons
                name="document-text-outline"
                size={22}
                color={Colors.light.primary}
              />
            </Pressable>
          </View>

          {/* Security / validation warning */}
          {warning ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                marginBottom: Spacing.md,
              }}
            >
              <Ionicons
                name="warning-outline"
                size={20}
                color={Colors.light.errorDark}
                style={{ marginRight: 8, marginTop: 1 }}
              />

              <AppText
                variant="caption"
                style={{
                  flex: 1,
                  color: Colors.light.errorDark,
                }}
              >
                {warning}
              </AppText>
            </View>
          ) : null}

          <AppButton
            title={
              loading
                ? "Creating Account..."
                : "Create Account"
            }
            onPress={handleRegister}
            disabled={loading}
          />
        </View>

        <View style={styles.loginContainer}>
          <AppText
            variant="caption"
            style={styles.loginText}
          >
            Already have an account?
          </AppText>

          <AppText
            variant="body"
            style={styles.loginLink}
            onPress={handleLogin}
          >
            Sign In
          </AppText>
        </View>

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
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },

  termsIconButton: {
    width: 42,
    height: 42,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },

  loginContainer: {
    alignItems: "center",
    marginTop: Spacing.lg,
  },

  loginText: {
    textAlign: "center",
  },

  loginLink: {
    color: Colors.light.primary,
    fontWeight: "600",
    marginTop: 6,
  },
});