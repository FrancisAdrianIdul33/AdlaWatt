import React, { useMemo, useState } from "react";

import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import {
  useApplianceCardStyles,
} from "@/components/forms/applianceCard";
import AppText from "@/components/ui/AppText";
import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";
import { Radius } from "@/constants/theme";

type ApplianceBoxProps = {
  name: string;
  wattage: string;
  color: string;
  imageSource?: ImageSourcePropType;
  selected?: boolean;

  // Main appliance selection
  onPress?: () => void;

  // Custom appliance controls
  isCustom?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onCamera?: () => void;
  onArchive?: () => void;
};

const defaultImage = require("@/assets/images/adlawatt-icon.png");

export default function ApplianceBox({
  name,
  wattage,
  color,
  imageSource = defaultImage,
  selected = false,
  onPress,
  isCustom = false,
  onEdit,
  onDelete,
  onCamera,
  onArchive,
}: ApplianceBoxProps) {
  const [deleteMode, setDeleteMode] = useState(false);
  const [menuMode, setMenuMode] = useState(false);

  const applianceCardStyles =
    useApplianceCardStyles();

  const colors = useAppColors();

  const styles = useMemo(
    () => getStyles(colors),
    [colors],
  );

  const handleDeleteConfirm = () => {
    setDeleteMode(false);
    setMenuMode(false);
    onDelete?.();
  };

  const handleDeleteCancel = () => {
    setDeleteMode(false);
  };

  const renderMenuLayer = () => (
    <>
      {/* ================================================= */}
      {/* BACK ARROW */}
      {/* ================================================= */}

      <Pressable
        onPress={() => setMenuMode(false)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Back to appliance"
        style={({ pressed }) => [
          styles.menuBack,
          pressed && styles.actionPressed,
        ]}
      >
        <MaterialCommunityIcons
          name="arrow-left"
          size={24}
          color={colors.text}
        />
      </Pressable>

      {/* ================================================= */}
      {/* 2x2 ACTION GRID */}
      {/* ================================================= */}

      <View style={styles.menuGrid}>
        {/* EDIT */}

        <Pressable
          onPress={onEdit}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Edit appliance"
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.actionPressed,
          ]}
        >
          <MaterialCommunityIcons
            name="pencil"
            size={22}
            color={colors.primary}
          />
        </Pressable>

        {/* CAMERA */}

        <Pressable
          onPress={onCamera}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Change appliance photo"
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.actionPressed,
          ]}
        >
          <MaterialCommunityIcons
            name="camera"
            size={22}
            color={colors.primary}
          />
        </Pressable>

        {/* ARCHIVE */}

        <Pressable
          onPress={onArchive}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Archive appliance"
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.actionPressed,
          ]}
        >
          <MaterialCommunityIcons
            name="archive"
            size={22}
            color={colors.primary}
          />
        </Pressable>

        {/* DELETE */}

        <Pressable
          onPress={() => setDeleteMode(true)}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Delete appliance"
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.actionPressed,
          ]}
        >
          <MaterialCommunityIcons
            name="delete"
            size={22}
            color={colors.error}
          />
        </Pressable>
      </View>
    </>
  );

  const renderDeleteConfirmation = () => (
    <View style={styles.deleteConfirmation}>
      <MaterialCommunityIcons
        name="alert-circle-outline"
        size={30}
        color={colors.error}
      />

      <AppText
        variant="caption"
        style={styles.deleteQuestion}
      >
        You want to delete this?
      </AppText>

      <View style={styles.confirmActions}>
        {/* NO */}

        <Pressable
          onPress={handleDeleteCancel}
          style={({ pressed }) => [
            styles.confirmButton,
            styles.noButton,
            pressed && styles.actionPressed,
          ]}
        >
          <AppText
            variant="caption"
            style={styles.noButtonText}
          >
            No
          </AppText>
        </Pressable>

        {/* YES */}

        <Pressable
          onPress={handleDeleteConfirm}
          style={({ pressed }) => [
            styles.confirmButton,
            styles.yesButton,
            pressed && styles.actionPressed,
          ]}
        >
          <AppText
            variant="caption"
            style={styles.yesButtonText}
          >
            Yes
          </AppText>
        </Pressable>
      </View>
    </View>
  );

  const renderNormalLayer = () => (
    <>
      {/* ================================================= */}
      {/* SELECTION CIRCLE */}
      {/* ================================================= */}

      <View
        style={[
          styles.selectionCircle,
          {
            borderColor: color,
            backgroundColor: selected
              ? color
              : colors.surface,
          },
        ]}
      >
        {selected && (
          <MaterialCommunityIcons
            name="check"
            size={18}
            color={colors.onPrimary}
          />
        )}
      </View>

      {/* ================================================= */}
      {/* APPLIANCE IMAGE */}
      {/* ================================================= */}

      <View
        style={[
          applianceCardStyles.imageContainer,
          {
            borderColor: color,
          },
        ]}
      >
        <Image
          source={imageSource}
          style={applianceCardStyles.image}
          resizeMode="cover"
        />
      </View>

      {/* ================================================= */}
      {/* APPLIANCE NAME */}
      {/* ================================================= */}

      <AppText
        variant="caption"
        style={applianceCardStyles.name}
        numberOfLines={2}
      >
        {name}
      </AppText>

      {/* ================================================= */}
      {/* WATTAGE */}
      {/* ================================================= */}

      <AppText
        variant="caption"
        style={applianceCardStyles.watts}
      >
        {wattage}
      </AppText>
    </>
  );

  return (
    <Pressable
      onPress={menuMode || deleteMode ? undefined : onPress}
      onLongPress={isCustom ? () => setMenuMode(true) : undefined}
      disabled={deleteMode || !onPress}
      style={({ pressed }) => [
        applianceCardStyles.boxCompact,
        {
          borderColor: color,
          position: "relative",
        },
        pressed && !deleteMode && styles.pressed,
      ]}
    >
      {deleteMode && isCustom ? (
        renderDeleteConfirmation()
      ) : menuMode && isCustom ? (
        renderMenuLayer()
      ) : (
        renderNormalLayer()
      )}
    </Pressable>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
  selectionCircle: {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 10,

    width: 28,
    height: 28,

    borderWidth: 2,
    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",
  },

  /* ======================================================= */
  /* SECOND LAYER (LONG-PRESS MENU) */
  /* ======================================================= */

  menuBack: {
    alignSelf: "flex-start",
    width: 32,
    height: 32,

    borderRadius: 16,

    alignItems: "center",
    justifyContent: "center",

    marginLeft: -4,
    marginBottom: 16,
  },

  menuGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },

  iconButton: {
    width: 44,
    height: 44,

    borderRadius: 22,

    alignItems: "center",
    justifyContent: "center",
  },

  /* ======================================================= */
  /* THIRD LAYER (DELETE CONFIRMATION) */
  /* ======================================================= */

  deleteConfirmation: {
    flex: 1,
    width: "100%",

    alignItems: "center",
    justifyContent: "center",
  },

  deleteQuestion: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 8,
  },

  confirmActions: {
    width: "100%",
    flexDirection: "column",
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 6,
  },

  confirmButton: {
    width: "100%",
    paddingVertical: 9,
    borderRadius: Radius.md,

    alignItems: "center",
    justifyContent: "center",
  },

  noButton: {
    backgroundColor: colors.surface,
  },

  yesButton: {
    backgroundColor: colors.error,
  },

  noButtonText: {
    color: colors.text,
    fontWeight: "600",
  },

  yesButtonText: {
    color: colors.onPrimary,
    fontWeight: "600",
  },

  /* ======================================================= */
  /* PRESS STATES */
  /* ======================================================= */

  pressed: {
    opacity: 0.7,
  },

  actionPressed: {
    opacity: 0.65,
  },
});