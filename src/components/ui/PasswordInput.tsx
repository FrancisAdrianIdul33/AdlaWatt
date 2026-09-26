import {
  useAppColors,
} from "@/hooks/useAppColors";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import AppInput from "@/components/ui/AppInput";

interface PasswordInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
}

export default function PasswordInput({
  label = "Password",
  value,
  onChangeText,
  placeholder = "Enter your password",
  error,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const colors = useAppColors();

  return (
    <View style={styles.container}>
      <AppInput
        label={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoCorrect={false}
        error={error}
        style={styles.input}
      />

      <Pressable
        style={styles.toggle}
        onPress={() => setShowPassword((previous) => !previous)}
        accessibilityRole="button"
        accessibilityLabel={
          showPassword ? "Hide password" : "Show password"
        }
      >
        <Ionicons
          name={showPassword ? "eye-off-outline" : "eye-outline"}
          size={22}
          color={colors.textSecondary}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },

  input: {
    paddingRight: 52,
  },

  toggle: {
    position: "absolute",
    right: 16,
    top: 42,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});