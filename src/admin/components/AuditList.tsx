import React, { useMemo, useState } from "react";
import {
  StyleSheet,
  TextInput,
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
// household Activity Logs, with type filter + text search.
// Mock entries until admin-scoped activity_logs reads land;
// search and pagination run client-side over the loaded page.
// ============================================================

type AuditFilter = "all" | "info" | "warning" | "error";

export default function AuditList() {
  const colors = useAppColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [filter, setFilter] = useState<AuditFilter>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const all = useMemo(() => getMockAuditLogs(), []);

  const filtered = useMemo(() => {
    const byType =
      filter === "all"
        ? all
        : filter === "error"
          ? all.filter(
              (log) =>
                log.type === "error" ||
                log.type === "critical",
            )
          : all.filter((log) => log.type === filter);

    const needle = query.trim().toLowerCase();

    if (!needle) {
      return byType;
    }

    return byType.filter((log) =>
      `${log.title} ${log.details ?? ""}`
        .toLowerCase()
        .includes(needle),
    );
  }, [all, filter, query]);

  const { items, totalPages } = useMemo(
    () => paginateAudit(filtered, page),
    [filtered, page],
  );

  return (
    <AnalyticsChartCard
      title="Audit trail"
      subtitle="Latest system events · searchable"
      icon="list-outline"
    >
      <View style={styles.searchRow}>
        <TextInput
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            setPage(1);
          }}
          placeholder="Search audit events"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          allowFontScaling={false}
          accessibilityRole="search"
          accessibilityLabel="Search audit events"
          style={styles.searchInput}
        />
      </View>

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
            title={
              query.trim() ? "No matching events" : "No audit events"
            }
            description={
              query.trim()
                ? `Nothing matches "${query.trim()}" for this filter yet.`
                : "No audit events for this filter yet."
            }
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
        Mock trail — admin-scoped activity_logs reads land next;
        search runs over the loaded page.
      </AppText>
    </AnalyticsChartCard>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    searchRow: {
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.md,
    },

    searchInput: {
      minHeight: 48,
      borderWidth: 2,
      borderColor: colors.cardBorder,
      borderRadius: 12,
      backgroundColor: colors.surface,
      color: colors.text,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },

    filterRow: {
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.sm,
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
