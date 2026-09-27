import React, { useMemo } from "react";

import {
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import Copyright from "@/components/ui/Copyright";
import NavBar from "@/components/layout/Navbar";
import ScreenContainer2 from "@/components/layout/ScreenContainer2";
import AppText from "@/components/ui/AppText";

import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";

// ============================================================
// USER MANUAL
//
// Template only — header card plus an empty content section.
// Manual text will be laid out inside the marked block below.
// ============================================================

export default function UserManualScreen() {
  const colors = useAppColors();

  const styles = useMemo(
    () => getStyles(colors),
    [colors],
  );

  return (
    <ScreenContainer2>
      {/* Fixed Navbar */}
      <NavBar />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerCard}>
          <AppText
            variant="heading"
            style={styles.title}
          >
            User Manual
          </AppText>

          <AppText
            variant="caption"
            style={styles.subtitle}
          >
            Guides for operating your
            AdlaWatt system.
          </AppText>
        </View>

        {/* ============================================
            USER MANUAL CONTENT GOES HERE
            (manual text will be laid out in this block)
            ============================================ */}
        <View style={styles.body}>
        </View>

        <Copyright />
      </ScrollView>
    </ScreenContainer2>
  );
}

const manualDimensions = {
  borderWidth: 3,
  cardRadius: 16,
};

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    scrollView: {
      flex: 1,
      backgroundColor: colors.background,
    },

    content: {
      padding: 16,
      paddingBottom: 24,
    },

    /* Header */

    headerCard: {
      backgroundColor: colors.glass.white,

      borderWidth:
        manualDimensions.borderWidth,

      borderColor: colors.primary,

      borderRadius:
        manualDimensions.cardRadius,

      padding: 18,

      marginBottom: 10,
    },

    title: {
      color: colors.text,
      fontWeight: "700",
    },

    subtitle: {
      color: colors.textSecondary,

      marginTop: 6,

      fontWeight: "400",

      lineHeight: 19,
    },

    /* Body (manual sections land here) */

    body: {
      width: "100%",
    },
  });
