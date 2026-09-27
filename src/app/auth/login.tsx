import { router } from "expo-router";
import React, { useRef, useState } from "react";
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
import { Routes } from "@/constants/routes";

import { loginUser } from "@/services/auth";

export default function LoginScreen() {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [warning, setWarning] = useState("");
  const [loading, setLoading] = useState(false);

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
  setWarning(
    result.error ??
      "We could not sign you in. Please check your information and try again.",
  );
  return;
}

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