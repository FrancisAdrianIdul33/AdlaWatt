import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";
import { useTypography } from "@/hooks/useTypography";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
    StyleSheet,
    TextInput,
    TextInputProps,
    View,
} from "react-native";

type AppSearchBoxProps = TextInputProps;

export default function AppSearchBox({
  style,
  ...props
}: AppSearchBoxProps) {
  const { scaledSize, family, weight } =
    useTypography();

  const colors = useAppColors();

  const styles = useMemo(
    () => getStyles(colors),
    [colors],
  );

  return (
    <View style={styles.container}>
      <TextInput
        {...props}
        allowFontScaling={false}
        placeholderTextColor={colors.textSecondary}
        style={[
          styles.input,
          {
            fontSize: scaledSize(16),
            fontFamily: family,
            fontWeight: weight,
          },
          style,
        ]}
      />

      <Ionicons
        name="search"
        size={20}
        color={colors.primary}
        style={styles.icon}
      />
    </View>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
  container: {
    position: "relative",
    marginBottom: 18,
  },

  input: {
    backgroundColor: colors.surface,
    color: colors.textSecondary,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingLeft: 16,
    paddingRight: 48, // Space reserved for the icon
    paddingVertical: 14,
    fontSize: 16,
  },

  icon: {
    position: "absolute",
    right: 16,
    top: 14,
  },
});