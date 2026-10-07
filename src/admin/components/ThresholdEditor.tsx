import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Pressable,
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
import type { AdminThresholds } from "@/admin/constants";
import {
  getDefaultThresholds,
} from "@/admin/services/adminService";
import { logActivity } from "@/services/activityLogService";

// ============================================================
// THRESHOLD EDITOR (admin-only elements)
//
// Staged Save/Cancel draft flow mirrors Menu preferences:
// edits stay local until Save. No backend write yet — Save
// stages locally with a v1 version stamp (change-management
// honesty). Ranges mirror validate_admin_thresholds() so a
// future store cannot be bypassed from the client.
// ============================================================

interface Row {
  key: keyof AdminThresholds;
  label: string;
  unit: string;
  step: number;
  min: number;
  max: number;
}

const ROWS: Row[] = [
  { key: "batteryVoltageMin", label: "Battery min voltage", unit: "V", step: 0.1, min: 10, max: 13 },
  { key: "batteryVoltageMax", label: "Battery max voltage", unit: "V", step: 0.1, min: 13, max: 15 },
  { key: "highLoadWatts", label: "High-load alert", unit: "W", step: 10, min: 100, max: 1000 },
  { key: "batteryTempHigh", label: "Battery temp high", unit: "°C", step: 1, min: 30, max: 60 },
  { key: "solarTempHigh", label: "Solar temp high", unit: "°C", step: 1, min: 40, max: 80 },
  { key: "interiorTempHigh", label: "Interior temp high", unit: "°C", step: 1, min: 30, max: 70 },
];

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export default function ThresholdEditor() {
  const colors = useAppColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [saved, setSaved] = useState<AdminThresholds>(() =>
    getDefaultThresholds(),
  );
  const [draft, setDraft] = useState<AdminThresholds>(() =>
    getDefaultThresholds(),
  );
  const [notice, setNotice] = useState<string | null>(null);

  const isDirty = JSON.stringify(saved) !== JSON.stringify(draft);

  const adjust = (row: Row, dir: 1 | -1) => {
    setDraft((prev) => {
      const next = round1(prev[row.key] + dir * row.step);
      const clamped = Math.min(row.max, Math.max(row.min, next));
      return { ...prev, [row.key]: clamped };
    });
    setNotice(null);
  };

  return (
    <AnalyticsChartCard
      title="Alert thresholds"
      subtitle="Staged drafts · v1 staged locally, not published"
      icon="options-outline"
    >
      <AppText
        variant="caption"
        style={styles.versionStamp}
      >
        Change-managed draft v1 — Save stages locally, publish
        lands with a future backend store.
      </AppText>

      <View style={styles.list}>
        {ROWS.map((row) => (
          <View key={row.key} style={styles.row}>
            <View style={styles.rowText}>
              <AppText variant="body" style={styles.label}>
                {row.label}
              </AppText>

              <AppText variant="heading" style={styles.value}>
                {draft[row.key]}
                {row.unit}
              </AppText>

              <AppText
                variant="caption"
                style={styles.range}
              >
                Allowed {row.min}–{row.max}
                {row.unit}
              </AppText>
            </View>

            <View style={styles.stepper}>
              <Pressable
                onPress={() => adjust(row, -1)}
                accessibilityRole="button"
                accessibilityLabel={`Decrease ${row.label}`}
                style={({ pressed }) => [
                  styles.stepButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name="remove"
                  size={20}
                  color={colors.accentContent}
                />
              </Pressable>

              <Pressable
                onPress={() => adjust(row, 1)}
                accessibilityRole="button"
                accessibilityLabel={`Increase ${row.label}`}
                style={({ pressed }) => [
                  styles.stepButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name="add"
                  size={20}
                  color={colors.accentContent}
                />
              </Pressable>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={() => {
            setDraft(saved);
            setNotice(null);
            // Accountability: record the discard, fire-and-forget.
            logActivity({
              title: "Threshold draft discarded",
              description:
                "Admin discarded staged alert-threshold edits.",
              type: "info",
            });
          }}
          disabled={!isDirty}
          accessibilityRole="button"
          accessibilityLabel="Discard threshold drafts"
          style={({ pressed }) => [
            styles.secondaryButton,
            !isDirty && styles.disabled,
            pressed && isDirty && styles.pressed,
          ]}
        >
          <AppText variant="button" style={styles.secondaryText}>
            Cancel
          </AppText>
        </Pressable>

        <Pressable
          onPress={() => {
            setSaved(draft);
            setNotice(
              "Thresholds staged locally (v1 draft, not published).",
            );
            // Accountability: record the stage, fire-and-forget.
            logActivity({
              title: "Threshold draft saved",
              description: `High-load cap staged at ${draft.highLoadWatts}W (v1 draft, not published).`,
              type: "info",
            });
          }}
          disabled={!isDirty}
          accessibilityRole="button"
          accessibilityLabel="Save threshold drafts"
          style={({ pressed }) => [
            styles.primaryButton,
            !isDirty && styles.disabled,
            pressed && isDirty && styles.pressed,
          ]}
        >
          <AppText variant="button" style={styles.primaryText}>
            Save
          </AppText>
        </Pressable>
      </View>

      {notice ? (
        <AppText variant="caption" style={styles.notice}>
          {notice}
        </AppText>
      ) : null}
    </AnalyticsChartCard>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    list: {
      gap: Spacing.sm,
      padding: Spacing.md,
    },

    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: Spacing.md,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.cardBorder,
      borderRadius: Radius.md,
    },

    rowText: {
      flex: 1,
      gap: 2,
    },

    label: {
      color: colors.text,
    },

    value: {
      color: colors.text,
      fontSize: 18,
    },

    range: {
      color: colors.textSecondary,
    },

    versionStamp: {
      color: colors.textSecondary,
      textAlign: "center",
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.md,
    },

    stepper: {
      flexDirection: "row",
      gap: Spacing.sm,
    },

    stepButton: {
      width: 48,
      height: 48,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: Radius.md,
      borderWidth: 2,
      borderColor: colors.cardBorder,
      backgroundColor: colors.glass.white,
    },

    actions: {
      flexDirection: "row",
      gap: Spacing.sm,
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.sm,
    },

    primaryButton: {
      flex: 1,
      minHeight: 52,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: Radius.md,
      backgroundColor: colors.primary,
    },

    primaryText: {
      color: colors.onPrimary,
    },

    secondaryButton: {
      flex: 1,
      minHeight: 52,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: Radius.md,
      borderWidth: 2,
      borderColor: colors.cardBorder,
      backgroundColor: colors.surface,
    },

    secondaryText: {
      color: colors.text,
    },

    disabled: {
      opacity: 0.5,
    },

    pressed: {
      opacity: 0.7,
    },

    notice: {
      color: colors.textSecondary,
      textAlign: "center",
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.md,
    },
  });
