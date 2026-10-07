import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
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
import { Bar, Type } from "@/constants/sizing";
import { Routes } from "@/constants/routes";
import {
  ADMIN_TABS,
  type AdminTab,
} from "@/admin/constants";

// ============================================================
// ADMIN NAV BAR BOTTOM
//
// Same shell + tokens as household NavBarBottom (accent line,
// bar background, 24px+ targets) but admin tabs only:
// Overview / Thresholds / Audit. Controlled by the admin
// screen so UI-first needs no extra routes.
// ============================================================

interface AdminNavBarBottomProps {
  value: AdminTab;
  onChange: (tab: AdminTab) => void;
}

export default function AdminNavBarBottom({
  value,
  onChange,
}: AdminNavBarBottomProps) {
  const pathname = usePathname();
  const colors = useAppColors();

  const styles = useMemo(
    () => getStyles(colors),
    [colors],
  );

  return (
    <View style={styles.wrapper}>
      <View style={styles.accentLine} />

      <View style={styles.container}>
        {ADMIN_TABS.map((tab) => {
          const isActive = value === tab.value;

          return (
            <Pressable
              key={tab.value}
              onPress={() => onChange(tab.value)}
              accessibilityRole="button"
              accessibilityLabel={tab.accessibilityLabel}
              accessibilityState={{ selected: isActive }}
              style={({ pressed }) => [
                styles.tab,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name={tab.icon}
                size={Bar.bottomNavIcon}
                color={
                  isActive
                    ? colors.bar.text
                    : colors.bar.muted
                }
              />

              <AppText
                variant="caption"
                style={[
                  styles.label,
                  isActive && styles.activeLabel,
                ]}
              >
                {tab.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {/* Hidden escape hatch: admin can still reach household.
          Cast needed until `npx expo start` regenerates typed
          routes to include /admin. */}
      <Pressable
        onPress={() =>
          router.navigate(
            (pathname === Routes.ADMIN
              ? Routes.DASHBOARD
              : Routes.ADMIN) as never,
          )
        }
        accessibilityRole="button"
        accessibilityLabel="Switch between admin and household dashboard"
        style={styles.switchRow}
      >
        <AppText
          variant="caption"
          style={styles.switchText}
        >
          {pathname === Routes.ADMIN
            ? "View household dashboard"
            : "Back to admin"}
        </AppText>
      </Pressable>
    </View>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    wrapper: {
      width: "100%",
    },

    accentLine: {
      width: "100%",
      height: 3,
      backgroundColor: colors.bar.accent,
    },

    container: {
      height: Bar.bottomNav,
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-evenly",
      backgroundColor: colors.bar.background,
    },

    tab: {
      flex: 1,
      height: "100%",
      minHeight: 48,
      alignItems: "center",
      justifyContent: "center",
      gap: 3,
    },

    label: {
      color: colors.bar.muted,
      fontSize: Type.caption,
      fontWeight: "600",
    },

    activeLabel: {
      color: colors.bar.text,
      fontWeight: "700",
    },

    pressed: {
      opacity: 0.7,
    },

    switchRow: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 8,
      backgroundColor: colors.bar.background,
    },

    switchText: {
      color: colors.textSecondary,
      textDecorationLine: "underline",
    },
  });
