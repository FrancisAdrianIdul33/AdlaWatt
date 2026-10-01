import { Ionicons } from "@expo/vector-icons";

import React, { ReactNode, useMemo } from "react";

import {
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import AppText from "@/components/ui/AppText";

import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";
import { Touch } from "@/constants/sizing";

// ============================================================
// STANDARD DROPDOWN MODAL
//
// The shared dropdown-picker used across the dashboard screens.
// "Opened" state is always this centered bottom-sheet-style
// modal so every dropdown looks and behaves the same.
// ============================================================

const MODAL_RADIUS = 18;

interface DropdownModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  showCloseButton?: boolean;
  dismissOnOverlayPress?: boolean;
}

export function DropdownModal({
  visible,
  title,
  onClose,
  children,
  showCloseButton = true,
  dismissOnOverlayPress = true,
}: DropdownModalProps) {
  const colors = useAppColors();
  const dropdownModalStyles = useMemo(
    () => getDropdownModalStyles(colors),
    [colors],
  );
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={
        showCloseButton ? onClose : () => {}
      }
    >
      <Pressable
        style={dropdownModalStyles.overlay}
        onPress={
          dismissOnOverlayPress
            ? onClose
            : undefined
        }
      >
        <Pressable
          style={dropdownModalStyles.card}
          // Swallow card taps so the overlay close doesn't fire.
          // stopPropagation keeps web from delivering the same
          // touch to both responders (orphan touchend noise).
          onPress={(event) => {
            (
              event as unknown as {
                stopPropagation?: () => void;
              }
            )?.stopPropagation?.();
          }}
        >
          <View
            style={dropdownModalStyles.header}
          >
            <AppText
              variant="body"
              style={dropdownModalStyles.title}
            >
              {title}
            </AppText>

            {showCloseButton && (
              <Pressable
                onPress={onClose}
                style={dropdownModalStyles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons
                  name="close-outline"
                  size={22}
                  color={colors.text}
                />
              </Pressable>
            )}
          </View>

          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ============================================================
// RADIO OPTION ROW
// Used by dropdowns whose options carry no colored icon.
// ============================================================

interface RadioOptionRowProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function RadioOptionRow({
  label,
  selected,
  onPress,
}: RadioOptionRowProps) {
  const colors = useAppColors();
  const dropdownModalStyles = useMemo(
    () => getDropdownModalStyles(colors),
    [colors],
  );
  return (
    <Pressable
      style={[
        dropdownModalStyles.option,
        selected &&
          dropdownModalStyles.optionSelected,
      ]}
      onPress={onPress}
    >
      <Ionicons
        name={
          selected
            ? "radio-button-on-outline"
            : "radio-button-off-outline"
        }
        size={18}
        color={colors.accentContent}
      />

      <AppText
        variant="caption"
        style={[
          dropdownModalStyles.optionText,
          selected &&
            dropdownModalStyles.optionTextSelected,
        ]}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

// ============================================================
// TINTED OPTION ROW
// Used by dropdowns whose options carry a colored icon. No
// radio dot - the pale background is tinted by the icon color.
// ============================================================

interface TintedOptionRowProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  selected: boolean;
  onPress: () => void;
}

function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");

  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function TintedOptionRow({
  label,
  icon,
  color,
  selected,
  onPress,
}: TintedOptionRowProps) {
  const colors = useAppColors();
  const dropdownModalStyles = useMemo(
    () => getDropdownModalStyles(colors),
    [colors],
  );
  return (
    <Pressable
      style={[
        dropdownModalStyles.option,
        {
          backgroundColor: withAlpha(
            color,
            selected ? 0.16 : 0.06,
          ),
        },
      ]}
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={18}
        color={color}
      />

      <AppText
        variant="caption"
        style={[
          dropdownModalStyles.optionText,
          selected &&
            dropdownModalStyles.optionTextSelected,
        ]}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const getDropdownModalStyles = (colors: AppColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },

    card: {
      width: "100%",
      maxWidth: 420,
      backgroundColor: colors.elevated,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: MODAL_RADIUS,
      padding: 17,
    },

    header: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },

    title: {
      color: colors.text,
      fontWeight: "700",
      fontSize: 17,
    },

    closeButton: {
      width: Touch.target,
      height: Touch.target,
      alignItems: "center",
      justifyContent: "center",
    },

    option: {
      width: "100%",
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 10,
      borderRadius: 10,
      marginVertical: 2,
    },

    optionSelected: {
      backgroundColor: colors.selectedWash,
    },

    optionText: {
      color: colors.text,
    },

    optionTextSelected: {
      fontWeight: "700",
    },
  });