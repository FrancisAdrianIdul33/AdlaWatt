import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import NavBar from "@/components/layout/Navbar";
import Copyright from "@/components/ui/Copyright";
import AppText from "@/components/ui/AppText";
import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";
import { Radius, Spacing } from "@/constants/theme";

import AdminScreenContainer from "@/admin/components/AdminScreenContainer";
import SystemOverviewSection from "@/admin/components/SystemOverviewSection";
import ThresholdEditor from "@/admin/components/ThresholdEditor";
import AuditList from "@/admin/components/AuditList";
import { useAdminGuard } from "@/admin/hooks/useAdminGuard";
import type { AdminTab } from "@/admin/constants";
import { getMockAdminOverview } from "@/admin/services/adminService";

// ============================================================
// ADMIN DASHBOARD SCREEN (UI-first)
//
// Same shell + tokens as household DashboardScreen:
// NavBar top, ScrollView, headerCard, sections, Copyright,
// bottom nav in flow. Goal/elements differ: oversight
// (system health, thresholds, audit) instead of personal use.
// All data is mock until Phase 2 admin reads land.
// ============================================================

export default function AdminDashboardScreen() {
  const colors = useAppColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { t } = useTranslation();
  const { canRender } = useAdminGuard();

  const [tab, setTab] = useState<AdminTab>("overview");
  const overview = useMemo(() => getMockAdminOverview(), []);

  if (!canRender) {
    return null;
  }

  return (
    <AdminScreenContainer activeTab={tab} onTabChange={setTab}>
      <NavBar deviceStatus={overview.deviceStatus} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerCard}>
          <AppText variant="title" style={styles.headerTitle}>
            {t("admin.title")}
          </AppText>

          <AppText variant="body" style={styles.headerSub}>
            {t("admin.subtitle")}
          </AppText>
        </View>

        {(tab === "overview" || tab === "thresholds") && (
          <SystemOverviewSection overview={overview} />
        )}

        {(tab === "thresholds" || tab === "overview") && (
          <ThresholdEditor />
        )}

        {(tab === "audit" || tab === "overview") && <AuditList />}

        <Copyright />
      </ScrollView>
    </AdminScreenContainer>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    scroll: {
      gap: Spacing.md,
      padding: Spacing.md,
      paddingBottom: Spacing.xl,
    },

    headerCard: {
      width: "100%",
      backgroundColor: colors.headerBackground,
      borderRadius: Radius.lg,
      borderWidth: 3,
      borderColor: colors.cardBorder,
      padding: Spacing.md,
      gap: 4,
    },

    headerTitle: {
      color: colors.headerContent,
    },

    headerSub: {
      color: colors.headerContent,
      opacity: 0.85,
    },
  });
