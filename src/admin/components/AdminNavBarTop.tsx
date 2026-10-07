import React, { useMemo } from "react";
import {
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

import AppText from "@/components/ui/AppText";
import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";
import { Bar } from "@/constants/sizing";
import { useAuth } from "@/context/AuthContext";

// ============================================================
// ADMIN NAV BAR TOP (English-only, pinned light)
//
// Same green header + yellow accent shell as the household
// NavBar (same Bar.appBar height, edge-to-edge width trick)
// but admin name only: no device-status capsule, no
// notification bell, no realtime subscription, no routing.
// Username comes from the AuthContext session cache (proper
// noun, never translated); all labels are hardcoded English
// so household language switches cannot affect admin.
// ============================================================

export default function AdminNavBarTop() {
  const colors = useAppColors();

  // Same synchronous session-cache source as household
  // NavBar: profile username first, email prefix fallback
  // so the slot is never empty while signed in.
  const { profileUsername, user: authUser } =
    useAuth();

  const fallbackName =
    authUser?.email?.split("@")[0] || null;

  const adminName = profileUsername || fallbackName;

  const { width: screenWidth } =
    useWindowDimensions();

  const styles = useMemo(
    () => getStyles(colors),
    [colors],
  );

  return (
    <View
      style={[
        styles.wrapper,
        {
          width: screenWidth,
          alignSelf: "center",
        },
      ]}
    >
      <View style={styles.container}>
        {adminName ? (
          <View
            style={styles.nameSlot}
            accessibilityRole="header"
            accessibilityLabel={`Admin signed in as ${adminName}`}
          >
            <AppText
              variant="body"
              style={styles.nameText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {adminName}
            </AppText>
          </View>
        ) : null}
      </View>

      <View style={styles.accentLine} />
    </View>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    wrapper: {
      width: "100%",
      zIndex: 100,
      elevation: 8,
      boxShadow: "0px 2px 4px rgba(0,0,0,0.12)",
    },

    container: {
      height: Bar.appBar,
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 16,
      backgroundColor: colors.bar.background,
    },

    nameSlot: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 8,
      minWidth: 0,
    },

    nameText: {
      color: colors.bar.text,
      fontSize: 14,
      fontWeight: "600",
      textAlign: "center",
    },

    accentLine: {
      width: "100%",
      height: 3,
      backgroundColor: colors.bar.accent,
    },
  });
