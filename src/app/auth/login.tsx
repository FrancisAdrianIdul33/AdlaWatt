import { router } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";

import AppInput from "@/components/ui/AppInput";
import Copyright from "@/components/ui/Copyright";
import PasswordInput from "@/components/ui/PasswordInput";
import AuthHeader from "@/components/layout/AuthHeader";
import ScreenContainer from "@/components/layout/ScreenContainer";
import AppButton from "@/components/ui/AppButton";
import AppLogo from "@/components/ui/AppLogo";
import AppText from "@/components/ui/AppText";
import { Colors } from "@/constants/colors";
import { Routes } from "@/constants/routes";

import { loginUser } from "@/services/auth";

import { Ionicons } from "@expo/vector-icons";

export default function LoginScreen() {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [warning, setWarning] = useState("");

  const handleLogin = async () => {
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
  }
};

  const handleRegister = () => {
    router.push(Routes.REGISTER);
  };

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* AdlaWatt Logo */}
        <View style={styles.logoContainer}>
          <AppLogo
            width={350}
            height={200}
          />
        </View>

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
          />

          <PasswordInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
          />

         {warning ? (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    }}
  >
    <Ionicons
      name="warning-outline"
      size={20}
      color={Colors.light.errorDark}
      style={{ marginRight: 8 }}
    />

    <AppText
      variant="caption"
      style={{
        color: Colors.light.errorDark,
        flex: 1,
      }}
    >
      {warning}
    </AppText>
  </View>
) : null}

<AppButton
  title="Login"
  onPress={handleLogin}
/>
        </View>

        <View style={styles.registerContainer}>
          <AppText variant="caption">
            {"Don't have an account?"}
          </AppText>

          <AppText
            variant="body"
            style={styles.registerLink}
            onPress={handleRegister}
          >
            Create Account
          </AppText>
        </View>

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

  logoContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },

  form: {
    width: "100%",
  },

  registerContainer: {
    alignItems: "center",
    marginTop: 28,
  },

  registerLink: {
    color: Colors.light.primary,
    fontWeight: "600",
    marginTop: 6,
  },
});