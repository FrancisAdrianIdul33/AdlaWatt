import React, { useMemo } from "react";

import { Ionicons } from "@expo/vector-icons";

import {
  Image,
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
// CUSTOM APPLIANCE MODAL (ADD + EDIT)
//
// Shared DropdownModal shell (same overlay, centered card,
// and header as CalendarModal) for both flows. Add flow is
// driven by ApplianceModal; edit flow reuses this exact
// layout prefilled with the custom appliance values, so
// both dialogs look identical apart from title + confirm.
// ============================================================

type CustomApplianceModalProps = {
  visible: boolean;
  mode?: "add" | "edit";
  name: string;
  watts: string;
  error: string;
  onNameChange: (text: string) => void;
  onWattsChange: (text: string) => void;
  onCancel: () => void;
  onAdd: () => void;
  onSave?: () => void;
  // Photo preview to display: a freshly picked local uri or
  // the stored uploaded url. Null renders the bundled
  // adlawatt icon — the default for every custom appliance.
  photoPreview: string | null;
  // True while a photo upload is in flight: the confirm
  // button dims into a Saving state.
  photoBusy: boolean;
  onPhotoPress: () => void;
};

const defaultPhoto = require(
  "@/assets/images/adlawatt-icon.png",
);

export default function CustomApplianceModal({
  visible,
  mode = "add",
  name,
  watts,
  error,
  onNameChange,
  onWattsChange,
  onCancel,
  onAdd,
  onSave,
  photoPreview,
  photoBusy,
  onPhotoPress,
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

  const isEdit = mode === "edit";
  const title = isEdit
    ? "Edit Custom Appliance"
    : "Add Custom Appliance";
  const confirmLabel = isEdit ? "Save" : "Add";
  const handleConfirm = isEdit
    ? (onSave ?? onAdd)
    : onAdd;

  return (
    <DropdownModal
      visible={visible}
      title={title}
      onClose={onCancel}
    >
      <AppText
        variant="caption"
        style={styles.infoNote}
      >
        Check the appliance wattage first, for
        example, soldering wire may use 15-25W.
      </AppText>

      {/* Photo display on top, picker button below it. */}
      <View style={styles.photoDisplay}>
        {photoPreview ? (
          <Image
            source={{ uri: photoPreview }}
            style={styles.photoDisplayImage}
            resizeMode="cover"
            accessibilityLabel="Custom appliance photo"
          />
        ) : (
          <Image
            source={defaultPhoto}
            style={styles.photoDefaultIcon}
            resizeMode="contain"
            accessibilityLabel="Default appliance icon"
          />
        )}
      </View>

      <Pressable
        onPress={onPhotoPress}
        disabled={photoBusy}
        style={({ pressed }) => [
          styles.photoButton,
          pressed && !photoBusy && styles.pressed,
          photoBusy && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={
          photoPreview
            ? "Change appliance photo"
            : "Add appliance photo"
        }
        accessibilityHint="Opens the photo picker"
      >
        <Ionicons
          name="camera-outline"
          size={20}
          color={colors.text}
        />

        <AppText
          variant="caption"
          style={styles.photoButtonText}
        >
          {photoPreview
            ? "Change Photo"
            : "Add Photo"}
        </AppText>
      </Pressable>

      <TextInput
        value={name}
        onChangeText={onNameChange}
        placeholder="Enter valid appliance name"
        placeholderTextColor={
          colors.textSecondary
        }
        allowFontScaling={false}
        style={[styles.input, inputFontStyle]}
        accessibilityLabel={
          isEdit
            ? "Edit custom appliance name"
            : "Add custom appliance name"
        }
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
        accessibilityLabel={
          isEdit
            ? "Edit custom appliance wattage"
            : "Add custom appliance wattage"
        }
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
          disabled={photoBusy}
          style={({ pressed }) => [
            styles.customAction,
            styles.cancelAction,
            pressed && !photoBusy && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={
            isEdit
              ? "Cancel edit custom appliance"
              : "Cancel add custom appliance"
          }
        >
          <AppText
            variant="caption"
            style={styles.cancelText}
          >
            Cancel
          </AppText>
        </Pressable>

        <Pressable
          onPress={handleConfirm}
          disabled={
            !name.trim() || !watts.trim() || photoBusy
          }
          style={({ pressed }) => [
            styles.customAction,
            styles.addAction,
            pressed && !photoBusy && styles.pressed,
            photoBusy && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={
            isEdit
              ? "Save custom appliance"
              : "Add custom appliance"
          }
        >
          <AppText
            variant="caption"
            style={styles.addText}
          >
            {photoBusy ? "Saving…" : confirmLabel}
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

    photoDisplay: {
      width: "100%",
      height: 180,
      borderRadius: Radius.md,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },

    photoDisplayImage: {
      width: "100%",
      height: "100%",
    },

    photoDefaultIcon: {
      width: 96,
      height: 96,
    },

    photoButton: {
      width: "100%",
      minHeight: Control.button,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: Radius.md,
      marginBottom: 8,
    },

    photoButtonText: {
      color: colors.text,
      fontWeight: "700",
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
