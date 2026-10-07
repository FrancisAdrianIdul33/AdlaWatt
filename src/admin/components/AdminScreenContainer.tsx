import React, { useMemo } from "react";
import {
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

import AdminNavBarBottom from "@/admin/components/AdminNavBarBottom";
import type { AdminTab } from "@/admin/constants";
import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";

// ============================================================
// ADMIN SCREEN CONTAINER
//
// Same contract as household ScreenContainer2: full-height
// background, centered maxWidth 768 column, bottom nav in
// normal flow so it never overlaps scroll content. Only
// difference: admin bottom tabs (controlled).
// ============================================================

interface AdminScreenContainerProps {
  children: React.ReactNode;
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  style?: StyleProp<ViewStyle>;
}

export default function AdminScreenContainer({
  children,
  activeTab,
  onTabChange,
  style,
}: AdminScreenContainerProps) {
  const colors = useAppColors();

  const styles = useMemo(
    () => getStyles(colors),
    [colors],
  );

  return (
    <View style={styles.container}>
      <View style={[styles.content, style]}>
        {children}
      </View>

      <AdminNavBarBottom
        value={activeTab}
        onChange={onTabChange}
      />
    </View>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    content: {
      flex: 1,
      width: "100%",
      maxWidth: 768,
      alignSelf: "center",
    },
  });
