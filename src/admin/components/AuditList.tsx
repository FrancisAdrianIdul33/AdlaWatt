import React, { useMemo, useState } from "react";
import {
  StyleSheet,
  View,
} from "react-native";

import ActivityLogCard from "@/components/ActivityLogCard";
import AnalyticsChartCard from "@/components/AnalyticsChartCard";
import AppText from "@/components/ui/AppText";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import { SlidingToggle } from "@/components/ui/SlidingToggle";
import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";
import { Spacing } from "@/constants/theme";
import {
  getMockAuditLogs,
  paginateAudit,
} from "@/admin/services/adminService";

// ============================================================
// AUDIT LIST (admin goal: oversight trail)
//
// Same ActivityLogCard + Pagination + EmptyState primitives as
// household Activity Logs, filtered by a SlidingToggle. Mock
// entries until admin reads land.
// ============================================================

type AuditFilter = "all" | "info" | "warning" | "error";

export default function AuditList() {
  const colors = useAppColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [filter, setFilter] = useState<AuditFilter>("all");
  const [page, setPage] = useState(1);

  const all = useMemo(() => getMockAuditLogs(), []);

  const filtered = useMemo(() => {
    if (filter === "all") {
      return all;
    }

    if (filter === "error") {
      return all.filter(
        (log) => log.type === "error" || log.type === "critical",
      );
    }

    return all.filter((log) => log.type === filter);
  }, [all, filter]);

  const { items, totalPages } = useMemo(
    () => paginateAudit(filtered, page),
    [filtered, page],
  );

  return (
    <AnalyticsChartCard
      title="Audit trail"
      subtitle="Latest system events (mock)"
      icon="list-outline"
    >
      <View style={styles.filterRow}>
        <SlidingToggle<AuditFilter>
          value={filter}
          onChange={(next) => {
            setFilter(next);
            setPage(1);
          }}
          options={[
            {
              value: "all",
              label: "All",
              activeColor: colors.primary,
              activeInk: colors.onPrimary,
              accessibilityLabel: "Show all audit events",
            },
            {
              value: "info",
              label: "Info",
              activeColor: colors.primary,
              activeInk: colors.onPrimary,
              accessibilityLabel: "Show info events",
            },
            {
              value: "warning",
              label: "Warn",
              activeColor: colors.secondary,
              activeInk: colors.text,
              accessibilityLabel: "Show warning events",
            },
            {
              value: "error",
              label: "Errors",
              activeColor: colors.error,
              activeInk: colors.onPrimary,
              accessibilityLabel: "Show error events",
            },
          ]}
        />
      </View>

      <View style={styles.list}>
        {items.length === 0 ? (
          <EmptyState
            title="No audit events"
            description="No audit events for this filter yet."
          />
        ) : (
          items.map((item) => (
            <ActivityLogCard key={item.id} item={item} />
          ))
        )}
      </View>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPrevious={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() =>
          setPage((p) => Math.min(totalPages, p + 1))
        }
      />

      <AppText variant="caption" style={styles.footnote}>
        Mock trail — Phase 2 wires this to admin-scoped
        activity_logs reads.
      </AppText>
    </AnalyticsChartCard>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    filterRow: {
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.md,
    },

    list: {
      gap: 12,
      padding: Spacing.md,
    },

    footnote: {
      color: colors.textSecondary,
      textAlign: "center",
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.md,
    },
  });
