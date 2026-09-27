import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import AppText from "@/components/ui/AppText";
import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
};

export default function Pagination({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
}: PaginationProps) {
  const colors = useAppColors();

  const styles = useMemo(
    () => getStyles(colors),
    [colors],
  );

  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  return (
    <View style={styles.container}>
      {/* Previous */}
      <Pressable
        style={[
          styles.navigationBox,
          isFirstPage && styles.disabledBox,
        ]}
        onPress={onPrevious}
        disabled={isFirstPage}
      >
        <Ionicons
          name="chevron-back-outline"
          size={22}
          color={
            isFirstPage
              ? colors.textSecondary
              : colors.accentContent
          }
        />

        <AppText
          variant="caption"
          style={[
            styles.navigationText,
            isFirstPage && styles.disabledText,
          ]}
        >
          Prev
        </AppText>
      </Pressable>

      {/* Page Information */}
      <View style={styles.pageBox}>
        <AppText
          variant="caption"
          style={styles.pageText}
        >
          Page {currentPage} of {totalPages}
        </AppText>
      </View>

      {/* Next */}
      <Pressable
        style={[
          styles.navigationBox,
          isLastPage && styles.disabledBox,
        ]}
        onPress={onNext}
        disabled={isLastPage}
      >
        <Ionicons
          name="chevron-forward-outline"
          size={22}
          color={
            isLastPage
              ? colors.textSecondary
              : colors.accentContent
          }
        />

        <AppText
          variant="caption"
          style={[
            styles.navigationText,
            isLastPage && styles.disabledText,
          ]}
        >
          Next
        </AppText>
      </Pressable>
    </View>
  );
}
const getStyles = (colors: AppColors) =>
  StyleSheet.create({
  container: {
    width: "80%", // Adjust overall pagination width
    alignSelf: "center", // Always centers the pagination

    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "center",

    gap: 6,
    marginTop: 16,
    marginBottom: 6,
  },

  navigationBox: {
    flex: 1,
    minHeight: 58,
    backgroundColor: colors.glass.white,
    borderWidth: 3,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },

  pageBox: {
    flex: 2,
    minHeight: 58,
    backgroundColor: colors.glass.white,
    borderWidth: 3,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  navigationText: {
    color: colors.text,
    fontWeight: "600",
    fontSize: 12,
  },

  pageText: {
    color: colors.text,
    fontWeight: "700",
    textAlign: "center",
    fontSize: 12,
  },

  disabledBox: {
    borderColor: colors.textSecondary,
    opacity: 0.5,
  },

  disabledText: {
    color: colors.textSecondary,
  },
});