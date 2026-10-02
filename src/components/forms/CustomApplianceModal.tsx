import React, { useMemo } from "react";

import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import AppText from "@/components/ui/AppText";
import {
  DropdownModal,
} from "@/components/ui/DropdownModal";

import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";
import {
  Radius,
} from "@/constants/theme";
import { Control, Field } from "@/constants/sizing";
import { useTypography } from "@/hooks/useTypography";

// ============================================================
// CUSTOM APPLIANCE MODAL (ADD-ONLY)
//
// Add flow extracted from ApplianceModal into the shared
// DropdownModal shell so it matches CalendarModal: same
// overlay, same centered card, same header. Edit flow stays
// inline in ApplianceModal for now.
// ============================================================

type CustomApplianceModalProps = {
  visible: boolean;
  name: string;
  watts: string;
  error: string;
  onNameChange: (text: string) => void;
  onWattsChange: (text: string) => void;
  onCancel: () => void;
  onAdd: () => void;
};

export default function CustomApplianceModal({
  visible,
  name,
  watts,
  error,
  onNameChange,
  onWattsChange,
  onCancel,
  onAdd,
}: CustomApplianceModalProps) {
  const colors = useAppColors();

  const styles = useMemo(
    () => getStyles(colors),
    [colors],
  );

  const { scaledSize, family, weight } =
    useTypography();

  const inputFontStyle = {
    fontSize: scaledSize(14),
    fontFamily: family,
    fontWeight: weight,
  };

  return (
    <DropdownModal
      visible={visible}
      title="Add Custom Appliance"
      onClose={onCancel}
    >
      <AppText
        variant="caption"
        style={styles.infoNote}
      >
        Check the appliance wattage first, for
        example, soldering wire may use 15-25W.
      </AppText>

      <TextInput
        value={name}
        onChangeText={onNameChange}
        placeholder="Enter valid appliance name"
        placeholderTextColor={
          colors.textSecondary
        }
        allowFontScaling={false}
        style={[styles.input, inputFontStyle]}
        accessibilityLabel="Add custom appliance name"
      />

      <TextInput
        value={watts}
        onChangeText={onWattsChange}
        placeholder="Enter wattage like 15-25"
        placeholderTextColor={
          colors.textSecondary
        }
        allowFontScaling={false}
        style={[styles.input, inputFontStyle]}
        keyboardType="numeric"
        accessibilityLabel="Add custom appliance wattage"
      />

      {error ? (
        <AppText
          variant="caption"
          style={styles.customError}
        >
          {error}
        </AppText>
      ) : null}

      <View style={styles.customActions}>
        <Pressable
          onPress={onCancel}
          style={({ pressed }) => [
            styles.customAction,
            styles.cancelAction,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Cancel add custom appliance"
        >
          <AppText
            variant="caption"
            style={styles.cancelText}
          >
            Cancel
          </AppText>
        </Pressable>

        <Pressable
          onPress={onAdd}
          disabled={
            !name.trim() || !watts.trim()
          }
          style={({ pressed }) => [
            styles.customAction,
            styles.addAction,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Add custom appliance"
        >
          <AppText
            variant="caption"
            style={styles.addText}
          >
            Add
          </AppText>
        </Pressable>
      </View>
    </DropdownModal>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    infoNote: {
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 17,
      marginBottom: 10,
    },

    input: {
      minHeight: Field.minHeight,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: Radius.md,
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      color: colors.text,
      fontSize: 14,
      marginBottom: 8,
    },

    customError: {
      color: colors.error,
      fontSize: 12,
      fontWeight: "600",
      marginBottom: 2,
    },

    customActions: {
      flexDirection: "row",
      gap: 10,
      marginTop: 10,
    },

    customAction: {
      flex: 1,
      minHeight: Control.button,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderRadius: Radius.md,
    },

    cancelAction: {
      borderColor: colors.error,
    },

    addAction: {
      borderColor: colors.primary,
    },

    cancelText: {
      color: colors.error,
      fontWeight: "700",
    },

    addText: {
      color: colors.accentContent,
      fontWeight: "700",
    },

  pressed: {
    opacity: 0.7,
  },
});
