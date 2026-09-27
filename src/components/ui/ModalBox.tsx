import React, { useMemo } from "react";

import {
    Modal,
    Pressable,
    StyleSheet,
    View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import AppText from "@/components/ui/AppText";
import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";
import { Touch } from "@/constants/sizing";

interface ModalBoxProps<T extends string> {
  visible: boolean;
  title: string;
  options: readonly T[];
  selectedValue: T;
  onSelect: (option: T) => void;
  onClose: () => void;
}

export default function ModalBox<T extends string>({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}: ModalBoxProps<T>) {
  const colors = useAppColors();
  const styles = useMemo(
    () => getStyles(colors),
    [colors],
  );
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={
          styles.modalOverlay
        }
        onPress={onClose}
      >
        <Pressable
          style={
            styles.modalCard
          }
          onPress={() => {}}
        >
          <View
            style={
              styles.modalHeader
            }
          >
            <AppText
              variant="body"
              style={
                styles.modalTitle
              }
            >
              {title}
            </AppText>

            <Pressable
              onPress={onClose}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons
                name="close-outline"
                size={22}
                color={colors.text}
              />
            </Pressable>
          </View>

          {options.map(
            (option) => (
              <Pressable
                key={option}
                style={[
                  styles.modalOption,
                  selectedValue ===
                    option &&
                    styles.selectedModalOption,
                ]}
                onPress={() =>
                  onSelect(option)
                }
              >
                <Ionicons
                  name={
                    selectedValue ===
                      option
                      ? "radio-button-on-outline"
                      : "radio-button-off-outline"
                  }
                  size={18}
                  color={
                    colors.primary
                  }
                />

                <AppText
                  variant="caption"
                  style={[
                    styles.modalOptionText,
                    selectedValue ===
                      option &&
                      styles.selectedModalOptionText,
                  ]}
                >
                  {option}
                </AppText>
              </Pressable>
            ),
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ============================================================
   STYLES
   ============================================================ */

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    /* ========================================================
       MODALS
    ======================================================== */

    modalOverlay: {
      flex: 1,
      backgroundColor:
        colors.overlay,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },

    modalCard: {
      width: "100%",
      maxWidth: 420,
      backgroundColor:
        colors.surface,
      borderRadius: 18,
      padding: 17,
    },

    modalHeader: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      marginBottom: 8,
    },

    modalTitle: {
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

    modalOption: {
      width: "100%",
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 10,
      borderRadius: 10,
    },

    selectedModalOption: {
      backgroundColor:
        colors.primaryWash,
    },

    modalOptionText: {
      color: colors.text,
    },

    selectedModalOptionText: {
      fontWeight: "700",
      color:
        colors.primary,
    },
  });