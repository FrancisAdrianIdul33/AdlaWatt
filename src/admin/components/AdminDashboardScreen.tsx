import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import Copyright from "@/components/ui/Copyright";
import AppText from "@/components/ui/AppText";
import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";
import { Radius, Spacing } from "@/constants/theme";

import AdminScreenContainer from "@/admin/components/AdminScreenContainer";
import AdminNavBarTop from "@/admin/components/AdminNavBarTop";
import AdminMenuSection from "@/admin/components/AdminMenuSection";
import SystemOverviewSection from "@/admin/components/SystemOverviewSection";
import ThresholdEditor from "@/admin/components/ThresholdEditor";
import AuditList from "@/admin/components/AuditList";
import { useAdminGuard } from "@/admin/hooks/useAdminGuard";
import type { AdminTab } from "@/admin/constants";
import {
  getAdminFleetHealth,
  getMockAdminOverview,
  type AdminFleetHealth,
} from "@/admin/services/adminService";
import { logActivity } from "@/services/activityLogService";

// ============================================================
// ADMIN DASHBOARD SCREEN (English-only, pinned light)
//
// Fixed light palette + default type (no Theme/Settings
// providers in app/admin/_layout) and hardcoded English so
// household theme/font/language changes never affect admin.
// English-only top status bar below replaces the household
// NavBar (whose a11y strings translate). Purpose-driven tabs:
// each tab answers one question (health now / what limits /
// who did what). Fleet aggregates load async with loading +
// stale states so the UI never looks broken; thresholds
// publish to the alert_thresholds backend store on Save.
// ============================================================

export default function AdminDashboardScreen() {
  const colors = useAppColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { canRender } = useAdminGuard();

  const [tab, setTab] = useState<AdminTab>("overview");
  const overview = useMemo(() => getMockAdminOverview(), []);
  const [fleet, setFleet] = useState<AdminFleetHealth | null>(null);
  const [fleetLoading, setFleetLoading] = useState(true);

  // Aggregates-only fleet read (no per-user rows). Falls back
  // to mock with stale=true inside the service — never blank.
  useEffect(() => {
    let cancelled = false;
    setFleetLoading(true);

    void getAdminFleetHealth().then((health) => {
      if (cancelled) {
        return;
      }

      setFleet(health);
      setFleetLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleTabChange = (next: AdminTab) => {
    setTab(next);
    // Accountability: record admin navigation, fire-and-forget.
    logActivity({
      title: "Admin tab viewed",
      description: `Admin opened the ${next} tab.`,
      type: "info",
    });
  };

  if (!canRender) {
    return null;
  }

  const fleetSummary = fleet
    ? `${fleet.deviceCount} device${fleet.deviceCount === 1 ? "" : "s"} · ${fleet.onlineCount} online · ${fleet.totalSolarWh24h}Wh solar/24h`
    : undefined;

  return (
    <AdminScreenContainer activeTab={tab} onTabChange={handleTabChange}>
      {/* Same green header + yellow accent as the household
          upper navbar, admin name only: no online/offline
          capsule, no notification bell. */}
      <AdminNavBarTop />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerCard}>
          <AppText variant="title" style={styles.headerTitle}>
            Admin Dashboard
          </AppText>

          <AppText variant="body" style={styles.headerSub}>
            System oversight preview — mock data until
            admin reads land.
          </AppText>
        </View>

        {tab === "overview" && (
          <>
            {fleetLoading && !fleet ? (
              <View
                style={styles.loadingCard}
                accessibilityRole="progressbar"
                accessibilityLiveRegion="polite"
                accessibilityLabel="Loading fleet health"
              >
                <ActivityIndicator
                  size="small"
                  color={colors.textSecondary}
                />
                <AppText
                  variant="caption"
                  style={styles.loadingText}
                >
                  Loading fleet aggregates…
                </AppText>
              </View>
            ) : (
              <SystemOverviewSection
                overview={overview}
                stale={fleet?.stale ?? true}
                fleetSummary={fleetSummary}
              />
            )}
          </>
        )}

        {tab === "thresholds" && <ThresholdEditor />}

        {tab === "audit" && <AuditList />}

        {tab === "menu" && <AdminMenuSection />}

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

    loadingCard: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      backgroundColor: colors.glass.white,
      borderWidth: 3,
      borderColor: colors.cardBorder,
      borderRadius: Radius.lg,
      padding: Spacing.md,
    },

    loadingText: {
      color: colors.textSecondary,
    },
  });
