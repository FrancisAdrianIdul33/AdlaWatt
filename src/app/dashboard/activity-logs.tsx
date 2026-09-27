import { Ionicons } from "@expo/vector-icons";

import React, {
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import Copyright from "@/components/ui/Copyright";
import NavBar from "@/components/layout/Navbar";
import ScreenContainer2 from "@/components/layout/ScreenContainer2";
import Pagination from "@/components/ui/Pagination";
import AppText from "@/components/ui/AppText";
import { DropdownModal, RadioOptionRow, TintedOptionRow } from "@/components/ui/DropdownModal";
import ActivityLogCard, { ACTIVITY_LOG_GAP } from "@/components/ActivityLogCard";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import { useSafeAsync } from "@/hooks/useSafeAsync";

import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";
import { supabase } from "@/lib/supabase";

type TimeFilter =
  | "All"
  | "Last Hour"
  | "Today"
  | "This Week"
  | "This Year";

type ActivityType =
  | "info"
  | "warning"
  | "error"
  | "critical";

type ActivityLog = {
  id: string;
  title: string;
  details: string;
  type: ActivityType;
  date: string;
  time: string;
  timestamp: number;
};

export default function ActivityLogsScreen() {
  const colors = useAppColors();

  const styles = useMemo(
    () => getStyles(colors),
    [colors],
  );

  const [timeFilter, setTimeFilter] =
    useState<TimeFilter>("All");

  const [typeFilter, setTypeFilter] =
    useState<"all" | ActivityType>("all");

  const [timeModalVisible, setTimeModalVisible] =
    useState(false);

  const [typeModalVisible, setTypeModalVisible] =
    useState(false);

  const [totalActivityLogs, setTotalActivityLogs] =
    useState(0);

  // ============================================
  // PAGINATION
  // ============================================

  const [currentPage, setCurrentPage] =
    useState(1);

  const activityLogsPerPage = 10;

  // ============================================
  // LOAD CURRENT USER'S ACTIVITY LOGS
  // ============================================

  const loadActivityLogs =
    async (): Promise<ActivityLog[]> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setTotalActivityLogs(0);
        return [];
      }

      const {
        data,
        error,
        count,
      } = await supabase
        .from("activity_logs")
        .select(
          "act_id, title, description, type, created_at",
          { count: "exact" },
        )
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw new Error(
          "We couldn't load your activity logs. Check your connection and try again.",
        );
      }

      const logs: ActivityLog[] = (data ?? []).map(
        (log) => {
          const dateObject = new Date(
            log.created_at,
          );

          const type: ActivityType =
            log.type === "warning" ||
            log.type === "error" ||
            log.type === "critical"
              ? log.type
              : "info";

          return {
            id: log.act_id,
            title: log.title,
            details: log.description,
            type,
            date: dateObject.toLocaleDateString(
              "en-US",
              {
                month: "short",
                day: "2-digit",
                year: "numeric",
              },
            ),
            time: dateObject.toLocaleTimeString(
              "en-US",
              {
                hour: "2-digit",
                minute: "2-digit",
              },
            ),
            timestamp: dateObject.getTime(),
          };
        },
      );

      setTotalActivityLogs(
        count ?? logs.length,
      );

      return logs;
    };

  const {
    data: loadedLogs,
    error: loadError,
    loading: isLoading,
    retry: retryLoad,
  } = useSafeAsync(loadActivityLogs, []);

  const activityLogs = useMemo(
    () => loadedLogs ?? [],
    [loadedLogs],
  );

  const hasLoadedData = activityLogs.length > 0;
  const showList =
    hasLoadedData || (!isLoading && !loadError);

  // ============================================
  // FILTER ACTIVITY LOGS
  // ============================================

  const filteredLogs = useMemo<ActivityLog[]>(
    () => {
      let filtered = [...activityLogs];

      if (typeFilter !== "all") {
        filtered = filtered.filter(
          (activity) =>
            activity.type === typeFilter,
        );
      }

      const now = Date.now();

      if (timeFilter !== "All") {
        const filterDuration: Record<
          Exclude<TimeFilter, "All">,
          number
        > = {
          "Last Hour": 60 * 60 * 1000,
          Today: 24 * 60 * 60 * 1000,
          "This Week": 7 * 24 * 60 * 60 * 1000,
          "This Year": 365 * 24 * 60 * 60 * 1000,
        };

        const minimumTimestamp =
          now - filterDuration[timeFilter];

        filtered = filtered.filter(
          (activity) =>
            activity.timestamp >=
              minimumTimestamp &&
            activity.timestamp <= now,
        );
      }

      return filtered;
    },
    [
      activityLogs,
      timeFilter,
      typeFilter,
    ],
  );

  // ============================================
  // PAGINATED ACTIVITY LOGS
  // ============================================

  const totalPages =
    filteredLogs.length === 0
      ? 0
      : Math.ceil(
          filteredLogs.length /
            activityLogsPerPage,
        );

  const pageStart =
    (currentPage - 1) *
    activityLogsPerPage;

  const pageEnd =
    currentPage *
    activityLogsPerPage;

  const currentPageLogs =
    filteredLogs.slice(
      pageStart,
      pageEnd,
    );

  // ============================================
  // FILTER HANDLERS
  // ============================================

  const handleTimeFilter = (
    filter: TimeFilter,
  ) => {
    setTimeFilter(filter);
    setCurrentPage(1);
    setTimeModalVisible(false);
  };

  const handleTypeFilter = (
    filter: "all" | ActivityType,
  ) => {
    setTypeFilter(filter);
    setCurrentPage(1);
    setTypeModalVisible(false);
  };

  // ============================================
  // ACTIVITY TYPE LABEL
  // ============================================

  const getTypeLabel = () => {
    switch (typeFilter) {
      case "info":
        return "Info";

      case "warning":
        return "Warning";

      case "error":
        return "Error";

      case "critical":
        return "Critical";

      default:
        return "All";
    }
  };

  // ============================================
  // ACTIVITY TYPE ICON
  // ============================================

  const getTypeIcon =
    (): keyof typeof Ionicons.glyphMap => {
      switch (typeFilter) {
        case "info":
          return "information-circle-outline";

        case "warning":
          return "warning-outline";

        case "error":
        case "critical":
          return "alert-circle-outline";

        default:
          return "list-outline";
      }
    };

  // ============================================
  // RENDER
  // ============================================

  return (
    <ScreenContainer2>
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
            Activity Logs
          </AppText>

          <AppText
            variant="caption"
            style={styles.subtitle}
          >
            System activity and appliance events will
            appear here.
          </AppText>
        </View>

        {/* Total Activity Logs */}

        <View style={styles.totalContainer}>
          <AppText
            variant="caption"
            style={styles.totalLabel}
          >
            Total Activity Logs:{" "}

            <AppText style={styles.totalValue}>
              {totalActivityLogs}
            </AppText>
          </AppText>
        </View>

        {/* Filters */}

        <View style={styles.filterRow}>
          {/* Time Filter */}

          <View style={styles.filterWrapper}>
            <Pressable
              onPress={() => {
                setTimeModalVisible(true);

                setTypeModalVisible(false);
              }}
              style={({ pressed }) => [
                styles.filterButton,
                pressed &&
                  styles.buttonPressed,
              ]}
            >
              <Ionicons
                name="time-outline"
                size={19}
                color={colors.accentContent}
              />

              <AppText
                variant="caption"
                style={styles.filterText}
              >
                {timeFilter}
              </AppText>

              <Ionicons
                name="chevron-down-outline"
                size={18}
                color={colors.text}
              />
            </Pressable>
          </View>

          {/* Activity Type Filter */}

          <View style={styles.filterWrapper}>
            <Pressable
              onPress={() => {
                setTypeModalVisible(true);

                setTimeModalVisible(false);
              }}
              style={({ pressed }) => [
                styles.filterButton,
                pressed &&
                  styles.buttonPressed,
              ]}
            >
              <Ionicons
                name={getTypeIcon()}
                size={19}
                color={
                  typeFilter === "error" ||
                  typeFilter === "critical"
                    ? colors.error
                    : typeFilter === "warning"
                      ? colors.secondary
                      : colors.accentContent
                }
              />

              <AppText
                variant="caption"
                style={styles.filterText}
              >
                {getTypeLabel()}
              </AppText>

              <Ionicons
                name="chevron-down-outline"
                size={18}
                color={colors.text}
              />
            </Pressable>
          </View>
        </View>

        {/* Loading / Error */}

        {isLoading && !hasLoadedData && (
          <View style={styles.statusBlock}>
            <ActivityIndicator
              size="large"
              color={colors.accentContent}
            />
          </View>
        )}

        {loadError && !hasLoadedData && (
          <ErrorState
            message={loadError}
            onRetry={retryLoad}
          />
        )}

        {/* Activity Cards */}

        {showList && (
          <View style={styles.activityList}>
            {currentPageLogs.length === 0 ? (
              <EmptyState
                icon="document-text-outline"
                title="No Activity Logs"
                description="No activities match the selected filters."
              />
            ) : (
              currentPageLogs.map((activity) => (
                <ActivityLogCard
                  key={activity.id}
                  item={activity}
                />
              ))
            )}
          </View>
        )}

        {/* Pagination */}

        <Pagination
          currentPage={
            filteredLogs.length === 0
              ? 0
              : currentPage
          }
          totalPages={totalPages}
          onPrevious={() =>
            setCurrentPage((page) =>
              Math.max(1, page - 1),
            )
          }
          onNext={() =>
            setCurrentPage((page) =>
              Math.min(totalPages, page + 1),
            )
          }
        />

        <Copyright />
      </ScrollView>

      {/* ========================================================
          TIME RANGE MODAL
      ======================================================== */}
      <DropdownModal
        visible={timeModalVisible}
        title="Time Range"
        onClose={() =>
          setTimeModalVisible(false)
        }
      >
        {(
          [
            "All",
            "Last Hour",
            "Today",
            "This Week",
            "This Year",
          ] as TimeFilter[]
        ).map((option) => (
          <RadioOptionRow
            key={option}
            label={option}
            selected={timeFilter === option}
            onPress={() =>
              handleTimeFilter(option)
            }
          />
        ))}
      </DropdownModal>

      {/* ========================================================
          ACTIVITY TYPE MODAL
      ======================================================== */}
      <DropdownModal
        visible={typeModalVisible}
        title="Activity Type"
        onClose={() =>
          setTypeModalVisible(false)
        }
      >
        {[
          {
            value: "all" as const,
            label: "All",
            icon: "list-outline" as const,
            color: colors.accentContent,
          },
          {
            value: "info" as const,
            label: "Info",
            icon: "information-circle-outline" as const,
            color: colors.accentContent,
          },
          {
            value: "warning" as const,
            label: "Warning",
            icon: "warning-outline" as const,
            color: colors.secondary,
          },
          {
            value: "error" as const,
            label: "Error",
            icon: "alert-circle-outline" as const,
            color: colors.error,
          },
          {
            value: "critical" as const,
            label: "Critical",
            icon: "alert-circle-outline" as const,
            color: colors.error,
          },
        ].map((option) => (
          <TintedOptionRow
            key={option.value}
            label={option.label}
            icon={option.icon}
            color={option.color}
            selected={
              typeFilter === option.value
            }
            onPress={() =>
              handleTypeFilter(
                option.value as
                  | "all"
                  | ActivityType,
              )
            }
          />
        ))}
      </DropdownModal>
    </ScreenContainer2>
  );
}

const dashboardDimensions = {
    horizontalPadding: 16,
    sectionSpacing: 14,
    cardRadius: 16,
    cardPadding: 18,

    filterGap: 10,
    filterHeight: 48,
    filterRadius: 14,
  };

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    scrollView: {
      flex: 1,
      backgroundColor: colors.background,
    },

    content: {
      paddingHorizontal:
        dashboardDimensions.horizontalPadding,

      paddingTop:
        dashboardDimensions.sectionSpacing,

      paddingBottom: 20,
    },

    /* Header */

    headerCard: {
      backgroundColor: colors.glass.white,

      borderWidth: 3,
      borderColor: colors.cardBorder,

      borderRadius:
        dashboardDimensions.cardRadius,

      padding:
        dashboardDimensions.cardPadding,

      marginBottom: 12,
    },

    title: {
      color: colors.text,
      fontWeight: "700",
    },

    subtitle: {
      color: colors.textSecondary,
      marginTop: 6,
      lineHeight: 20,
    },

    /* Total */

    totalContainer: {
      width: "100%",
      alignItems: "flex-end",
      marginBottom: 10,
    },

    totalLabel: {
      color: colors.textSecondary,
      textAlign: "right",
    },

    totalValue: {
      color: colors.text,
      fontWeight: "700",
    },

    /* Filters */

    filterRow: {
      width: "100%",

      flexDirection: "row",

      gap: dashboardDimensions.filterGap,

      marginBottom: 14,

      zIndex: 10,
    },

    filterWrapper: {
      flex: 1,
      position: "relative",
    },

    filterButton: {
      height:
        dashboardDimensions.filterHeight,

      width: "100%",

      flexDirection: "row",

      alignItems: "center",

      paddingHorizontal: 13,

      gap: 8,

      backgroundColor: colors.glass.white,

      borderWidth: 3,

      borderColor: colors.primary,

      borderRadius:
        dashboardDimensions.filterRadius,
    },

    filterText: {
      flex: 1,

      color: colors.text,

      fontWeight: "600",
    },

    buttonPressed: {
      opacity: 0.75,
    },

    /* Activity List */

    activityList: {
      width: "100%",

      gap: ACTIVITY_LOG_GAP,

      zIndex: 1,
    },

    statusBlock: {
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 40,
    },
  });