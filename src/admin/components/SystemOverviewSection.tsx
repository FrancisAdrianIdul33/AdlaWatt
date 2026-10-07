import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  StyleSheet,
  View,
} from "react-native";

import AnalyticsChartCard from "@/components/AnalyticsChartCard";
import AppText from "@/components/ui/AppText";
import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";
import { Radius, Spacing } from "@/constants/theme";
import type { AdminOverview } from "@/admin/services/adminService";

// ============================================================
// SYSTEM OVERVIEW SECTION (admin goal, household UI)
//
// Same card shell + tokens as household analytics cards.
// Answers one question: "is the fleet healthy right now?"
// Aggregates-only (no per-user rows); stale banner + source
// label keep the UI honest when the RPC is unreachable.
// ============================================================

export default function SystemOverviewSection({
  overview,
  stale = true,
  fleetSummary,
}: {
  overview: AdminOverview;
  /** False once the get_admin_fleet_health RPC succeeds. */
  stale?: boolean;
  /** Short aggregate line, e.g. "1 device · 1 online". */
  fleetSummary?: string;
}) {
  const colors = useAppColors();

  const styles = useMemo(
    () => getStyles(colors),
    [colors],
  );

  const cells: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
    badge?: string;
  }[] = [
    {
      icon: "battery-charging-outline",
      label: "Battery",
      value: `${overview.batteryLevel}% · ${overview.batteryVoltage.toFixed(1)}V`,
      badge: overview.batteryLevel >= 20 ? "Safe" : "Low",
    },
    {
      icon: "sunny-outline",
      label: "Solar input",
      value: `${overview.solarInput}W`,
    },
    {
      icon: "flash-outline",
      label: "Current load",
      value: `${overview.currentLoad}W`,
    },
    {
      icon: "thermometer-outline",
      label: "Battery temp",
      value: `${overview.batteryTemp}°C`,
    },
    {
      icon: "hardware-chip-outline",
      label: "Device",
      value: overview.deviceStatus,
      badge: overview.deviceStatus,
    },
    {
      icon: "notifications-outline",
      label: "Unread alerts",
      value: `${overview.unreadAlerts}`,
    },
  ];

  return (
    <AnalyticsChartCard
      title="System overview"
      subtitle={`Last sync ${overview.lastSync}`}
      icon="pulse-outline"
    >
      {stale ? (
        <AppText
          variant="caption"
          style={styles.staleBanner}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          Showing cached snapshot — fleet RPC unreachable.
        </AppText>
      ) : null}

      {fleetSummary ? (
        <AppText
          variant="caption"
          style={styles.source}
        >
          {fleetSummary} · Fleet aggregate · no per-user rows
        </AppText>
      ) : (
        <AppText
          variant="caption"
          style={styles.source}
        >
          Fleet aggregate · no per-user rows
        </AppText>
      )}
      <View style={styles.grid}>
        {cells.map((cell) => (
          <View key={cell.label} style={styles.cell}>
            <Ionicons
              name={cell.icon}
              size={22}
              color={colors.accentContent}
              accessibilityRole="text"
              accessibilityLabel={cell.label}
            />

            <AppText
              variant="caption"
              style={styles.label}
            >
              {cell.label}
            </AppText>

            <AppText
              variant="heading"
              style={styles.value}
            >
              {cell.value}
            </AppText>

            <View style={styles.badgeSlot}>
              {cell.badge ? (
                <View style={styles.badge}>
                  <AppText
                    variant="caption"
                    style={styles.badgeText}
                  >
                    {cell.badge}
                  </AppText>
                </View>
              ) : null}
            </View>
          </View>
        ))}
      </View>

      <AppText
        variant="caption"
        style={styles.footnote}
      >
        Solar {overview.solarTemp}°C · Interior{" "}
        {overview.interiorTemp}°C
      </AppText>
    </AnalyticsChartCard>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.sm,
      padding: Spacing.md,
    },

    cell: {
      flexGrow: 1,
      flexBasis: "30%",
      minWidth: 140,
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.sm,
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.cardBorder,
      borderRadius: Radius.md,
    },

    label: {
      color: colors.textSecondary,
      textAlign: "center",
    },

    value: {
      color: colors.text,
      textAlign: "center",
      fontSize: 18,
    },

    badgeSlot: {
      minHeight: 24,
      alignItems: "center",
      justifyContent: "flex-start",
    },

    badge: {
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: Radius.round,
      backgroundColor: colors.primary,
    },

    badgeText: {
      color: colors.onPrimary,
      fontWeight: "600",
      fontSize: 12,
    },

    footnote: {
      color: colors.textSecondary,
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.md,
      textAlign: "center",
    },

    staleBanner: {
      color: colors.error,
      textAlign: "center",
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.sm,
      fontWeight: "600",
    },

    source: {
      color: colors.textSecondary,
      textAlign: "center",
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.sm,
    },
  });
