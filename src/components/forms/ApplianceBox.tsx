import React, { useMemo, useRef, useState } from "react";

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
import { Touch } from "@/constants/sizing";

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
  const [archiveMode, setArchiveMode] = useState(false);
  const [menuMode, setMenuMode] = useState(false);

  // A tap on the nested 3-dot toggle also bubbles to the outer
  // box Pressable. The flag makes the outer handler ignore that
  // one tap so opening/closing the menu never toggles selection.
  const suppressNextSelect = useRef(false);

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

  const handleArchiveConfirm = () => {
    setArchiveMode(false);
    setMenuMode(false);
    onArchive?.();
  };

  const handleArchiveCancel = () => {
    setArchiveMode(false);
  };

  // The same 3-dot icon opens and closes the options menu.
  // There is no back arrow: tapping the dots again returns
  // the box to its default view.
  const handleDotsPress = () => {
    suppressNextSelect.current = true;
    setMenuMode((current) => !current);
  };

  const handleBoxPress = () => {
    if (suppressNextSelect.current) {
      suppressNextSelect.current = false;
      return;
    }

    onPress?.();
  };

  const renderDotsToggle = (
    accessibilityLabel: string,
  ) => (
    <Pressable
      onPress={handleDotsPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.menuDots,
        pressed && styles.actionPressed,
      ]}
    >
      <MaterialCommunityIcons
        name="dots-vertical"
        size={Touch.icon}
        color={colors.textSecondary}
      />
    </Pressable>
  );

  const renderMenuLayer = () => (
    <>
      {/* ================================================= */}
      {/* 2x2 ACTION GRID (centered both axes) */}
      {/* ================================================= */}

      <View style={styles.menuArea}>
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
            color={colors.accentContent}
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
            color={colors.accentContent}
          />
        </Pressable>

        {/* ARCHIVE */}

        <Pressable
          onPress={() => setArchiveMode(true)}
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
            color={colors.accentContent}
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
      </View>

      {/* ================================================= */}
      {/* CLOSE: same 3-dot icon (no back arrow) */}
      {/* ================================================= */}

      <View style={styles.dotsRow}>
        {renderDotsToggle("Hide appliance options")}
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
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Do not delete appliance"
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
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Confirm delete appliance"
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

  const renderArchiveConfirmation = () => (
    <View style={styles.deleteConfirmation}>
      <MaterialCommunityIcons
        name="archive-outline"
        size={30}
        color={colors.accentContent}
      />

      <AppText
        variant="caption"
        style={styles.deleteQuestion}
      >
        Archive this appliance?
      </AppText>

      <View style={styles.confirmActions}>
        {/* NO */}

        <Pressable
          onPress={handleArchiveCancel}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Do not archive appliance"
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
          onPress={handleArchiveConfirm}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Confirm archive appliance"
          style={({ pressed }) => [
            styles.confirmButton,
            styles.archiveButton,
            pressed && styles.actionPressed,
          ]}
        >
          <AppText
            variant="caption"
            style={styles.archiveButtonText}
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

      {/* ================================================= */}
      {/* 3-DOT OPTIONS TOGGLE (custom boxes only) */}
      {/* ================================================= */}

      {isCustom ? (
        <View style={styles.dotsRow}>
          {renderDotsToggle("Show appliance options")}
        </View>
      ) : null}
    </>
  );

  return (
    <Pressable
      onPress={
        menuMode || deleteMode || archiveMode
          ? undefined
          : handleBoxPress
      }
      disabled={deleteMode || archiveMode || !onPress}
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
      ) : archiveMode && isCustom ? (
        renderArchiveConfirmation()
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
    bottom: 12,
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
  /* SECOND LAYER (OPTIONS MENU) */
  /* ======================================================= */

  // In-flow row pinning the 3-dot toggle to the right side
  // below the content, in both the default and menu layers.
  // Name/wattage keep their exact catalog spots because the
  // dots own dedicated layout space inside boxCustom.
  // hitSlop={10} on the toggle keeps the effective target 48px.
  dotsRow: {
    width: "100%",
    alignItems: "flex-end",
    marginTop: 4,
  },

  menuDots: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  // Flexible area absorbing the height difference between the
  // default content and the 2x2 grid, so the dots row below it
  // lands at the exact same Y in both layers (fixed toggle).
  // The grid stays horizontally centered by menuGrid and is
  // vertically centered here.
  menuArea: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
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
    width: Touch.target,
    height: Touch.target,

    borderRadius: 24,

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
    alignItems: "center",
    gap: 10,
    marginTop: 12,
  },

  // Compact text-sized buttons: minWidth keeps No/Yes an
  // identical pair. hitSlop on each button restores the 48px
  // pressable floor (visible height is ~36px).
  confirmButton: {
    minWidth: 96,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderRadius: Radius.md,

    alignItems: "center",
    justifyContent: "center",
  },

  noButton: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
  },

  yesButton: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },

  archiveButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  noButtonText: {
    color: colors.text,
    fontWeight: "600",
  },

  yesButtonText: {
    color: colors.onPrimary,
    fontWeight: "600",
  },

  archiveButtonText: {
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