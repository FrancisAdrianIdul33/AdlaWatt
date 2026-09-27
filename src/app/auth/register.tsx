import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import AppCheckbox from "@/components/ui/AppCheckbox";
import AppInput from "@/components/ui/AppInput";
import PasswordInput from "@/components/ui/PasswordInput";
import TermsModal from "@/components/forms/TermsModal";
import AuthFooter from "@/components/layout/AuthFooter";
import AuthHeader from "@/components/layout/AuthHeader";
import AuthLogo from "@/components/layout/AuthLogo";
import AuthWarning from "@/components/layout/AuthWarning";
import ScreenContainer from "@/components/layout/ScreenContainer";
import AppButton from "@/components/ui/AppButton";
import { useAppColors } from "@/hooks/useAppColors";
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
                color={colors.primaryText}
              />
            </Pressable>
          </View>

          <AuthWarning message={warning} />

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
});