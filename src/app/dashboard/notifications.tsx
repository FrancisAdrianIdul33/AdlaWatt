import { Ionicons } from "@expo/vector-icons";

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import Copyright from "@/components/ui/Copyright";

import NavBar from "@/components/layout/Navbar";

import ScreenContainer2 from "@/components/layout/ScreenContainer2";

import { DropdownModal, RadioOptionRow, TintedOptionRow } from "@/components/ui/DropdownModal";

import NotificationCard, {
  NotificationCardData,
  NotificationType,
} from "@/components/NotificationCard";

import Pagination from "@/components/ui/Pagination";

import AppText from "@/components/ui/AppText";

import EmptyState from "@/components/ui/EmptyState";

import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";
import { OptionRow } from "@/constants/sizing";

import { supabase } from "@/lib/supabase";

type TimeFilter =
  | "All"
  | "Last Hour"
  | "Today"
  | "This Week"
  | "This Year";

type NotificationData = NotificationCardData & {
  timestamp: number;
};

export default function NotificationsScreen() {
  const colors = useAppColors();

  const styles = useMemo(
    () => getStyles(colors),
    [colors],
  );

  const [notifications, setNotifications] =
    useState<NotificationData[]>([]);

  const [timeFilter, setTimeFilter] =
    useState<TimeFilter>("All");

  const [typeFilter, setTypeFilter] =
    useState<"All" | NotificationType>("All");

  const [timeModalVisible, setTimeModalVisible] =
    useState(false);

  const [typeModalVisible, setTypeModalVisible] =
    useState(false);

  // ============================================
  // PAGINATION
  // ============================================

  const [currentPage, setCurrentPage] =
    useState(1);

  const notificationsPerPage = 10;

  // ============================================
  // LOAD CURRENT USER'S NOTIFICATIONS
  // ============================================

  useEffect(() => {
    const loadNotifications = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setNotifications([]);
        return;
      }

      const { data, error } = await supabase
        .from("notifications")
        .select(
          "notif_id, user_id, title, description, type, read, created_at",
        )
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "Error loading notifications:",
          error.message,
        );

        setNotifications([]);
        return;
      }

      const formattedNotifications: NotificationData[] =
        (data ?? []).map((notification) => {
          const dateObject = new Date(
            notification.created_at,
          );

          return {
            id: notification.notif_id,
            title: notification.title,
            message: notification.description,

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

            type:
              notification.type as NotificationType,

            isRead: notification.read,

            timestamp: dateObject.getTime(),
          };
        });

      setNotifications(formattedNotifications);
    };

    loadNotifications();
  }, []);

  // ============================================
  // TOTAL NOTIFICATIONS
  // ============================================

  const totalNotifications =
    notifications.length;

  // ============================================
  // FILTER NOTIFICATIONS
  // ============================================

  const filteredNotifications = useMemo(() => {
    let result = [...notifications];

    if (typeFilter !== "All") {
      result = result.filter(
        (notification) =>
          notification.type === typeFilter,
      );
    }

    const now = new Date();

    if (timeFilter === "Today") {
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );

      result = result.filter(
        (notification) =>
          notification.timestamp >=
          startOfDay.getTime(),
      );
    }

    if (timeFilter === "Last Hour") {
      result = result.filter(
        (notification) =>
          notification.timestamp >=
          now.getTime() - 60 * 60 * 1000,
      );
    }

    if (timeFilter === "This Week") {
      const startOfWeek = new Date(now);

      startOfWeek.setDate(
        now.getDate() - now.getDay(),
      );

      startOfWeek.setHours(0, 0, 0, 0);

      result = result.filter(
        (notification) =>
          notification.timestamp >=
          startOfWeek.getTime(),
      );
    }

    if (timeFilter === "This Year") {
      const startOfYear = new Date(
        now.getFullYear(),
        0,
        1,
      );

      result = result.filter(
        (notification) =>
          notification.timestamp >=
          startOfYear.getTime(),
      );
    }

    return result.sort(
      (a, b) => b.timestamp - a.timestamp,
    );
  }, [
    notifications,
    timeFilter,
    typeFilter,
  ]);

  // ============================================
  // PAGINATION CALCULATIONS
  // ============================================

  const totalPages = Math.ceil(
    filteredNotifications.length /
      notificationsPerPage,
  );

  const pageStart =
    (currentPage - 1) *
    notificationsPerPage;

  const currentPageNotifications =
    totalPages === 0
      ? []
      : filteredNotifications.slice(
          pageStart,
          pageStart + notificationsPerPage,
        );

  const displayCurrentPage =
    totalPages === 0 ? 0 : currentPage;

  // ============================================
  // RECENT / EARLIER
  // ============================================

  const recentNotifications =
    currentPageNotifications.filter(
      (notification) =>
        !notification.isRead,
    );

  const earlierNotifications =
    currentPageNotifications.filter(
      (notification) =>
        notification.isRead,
    );

  // ============================================
  // FILTER HANDLERS
  // ============================================

  const handleTimeFilter = (
    value: TimeFilter,
  ) => {
    setTimeFilter(value);
    setCurrentPage(1);
    setTimeModalVisible(false);
  };

  const handleTypeFilter = (
    value: "All" | NotificationType,
  ) => {
    setTypeFilter(value);
    setCurrentPage(1);
    setTypeModalVisible(false);
  };

  // ============================================
  // TYPE LABEL
  // ============================================

  const getTypeLabel = () => {
    switch (typeFilter) {
      case "normal":
        return "Normal";

      case "alert":
        return "Alert";

      default:
        return "All";
    }
  };

  // ============================================
  // TYPE ICON
  // ============================================

  const getTypeIcon =
    (): keyof typeof Ionicons.glyphMap => {
      switch (typeFilter) {
        case "normal":
          return "notifications-outline";

        case "alert":
          return "alert-circle-outline";

        default:
          return "list-outline";
      }
    };

  // ============================================
  // MARK ALL AS READ
  // ============================================

  const handleMarkAsRead = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error(
        "No authenticated user found.",
      );

      return;
    }

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);

    if (error) {
      console.error(
        "Error marking notifications as read:",
        error.message,
      );

      return;
    }

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        isRead: true,
      })),
    );
  };

  // ============================================
  // RENDER
  // ============================================

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
            Notifications
          </AppText>

          <AppText
            variant="caption"
            style={styles.subtitle}
          >
            System notifications and important
            alerts will appear here.
          </AppText>
        </View>

        {/* Total Notifications */}
        <View style={styles.totalContainer}>
          <AppText
            variant="caption"
            style={styles.totalText}
          >
            Total Notifications:{" "}

            <AppText
              style={styles.totalNumber}
            >
              {totalNotifications}
            </AppText>
          </AppText>
        </View>

        {/* Filters */}
        <View style={styles.controlsContainer}>
          {/* Time Dropdown */}
          <View style={styles.dropdownWrapper}>
            <Pressable
              style={styles.dropdownButton}
              onPress={() => {
                setTimeModalVisible(true);

                setTypeModalVisible(false);
              }}
            >
              <Ionicons
                name="time-outline"
                size={18}
                color={colors.primary}
              />

              <AppText
                variant="caption"
                style={styles.dropdownButtonText}
              >
                {timeFilter}
              </AppText>

              <Ionicons
                name="chevron-down-outline"
                size={17}
                color={colors.primary}
              />
            </Pressable>
          </View>

          {/* Type Dropdown */}
          <View style={styles.dropdownWrapper}>
            <Pressable
              style={styles.dropdownButton}
              onPress={() => {
                setTypeModalVisible(true);

                setTimeModalVisible(false);
              }}
            >
              <Ionicons
                name={getTypeIcon()}
                size={18}
                color={
                  typeFilter === "alert"
                    ? colors.error
                    : colors.primary
                }
              />

              <AppText
                variant="caption"
                style={styles.dropdownButtonText}
              >
                {getTypeLabel()}
              </AppText>

              <Ionicons
                name="chevron-down-outline"
                size={17}
                color={colors.primary}
              />
            </Pressable>
          </View>

          {/* Mark as Read */}
          <Pressable
            style={styles.markReadButton}
            onPress={handleMarkAsRead}
          >
            <Ionicons
              name="checkmark-done-outline"
              size={17}
              color={colors.onPrimary}
            />

            <AppText
              variant="caption"
              style={styles.markReadText}
            >
              Mark as Read
            </AppText>
          </Pressable>
        </View>

        {/* Recent */}
        {recentNotifications.length > 0 && (
          <View style={styles.section}>
            <AppText
              variant="body"
              style={styles.sectionTitle}
            >
              Recent
            </AppText>

            <View
              style={styles.notificationList}
            >
              {recentNotifications.map(
                (notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                  />
                ),
              )}
            </View>
          </View>
        )}

        {/* Read Notifications */}
        {earlierNotifications.length > 0 && (
          <View
            style={styles.notificationList}
          >
            {earlierNotifications.map(
              (notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                />
              ),
            )}
          </View>
        )}

        {/* Empty State */}
        {currentPageNotifications.length === 0 && (
          <EmptyState
            icon="notifications-off-outline"
            title="No Notifications"
            description="No notifications found for the selected filters."
          />
        )}

        {/* Pagination - Always Visible */}
        <Pagination
          currentPage={displayCurrentPage}
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
          NOTIFICATION TYPE MODAL
      ======================================================== */}
      <DropdownModal
        visible={typeModalVisible}
        title="Notification Type"
        onClose={() =>
          setTypeModalVisible(false)
        }
      >
        {[
          {
            value: "All" as const,
            label: "All",
            icon: "list-outline" as const,
            color: colors.primary,
          },
          {
            value: "normal" as const,
            label: "Normal",
            icon: "notifications-outline" as const,
            color: colors.primary,
          },
          {
            value: "alert" as const,
            label: "Alert",
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
                  | "All"
                  | NotificationType,
              )
            }
          />
        ))}
      </DropdownModal>
    </ScreenContainer2>
  );
}

const notificationDimensions = {
  borderWidth: 3,
  cardRadius: 16,

  filterHeight: OptionRow.minHeight,
  filterRadius: 12,

  buttonRadius: 12,
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
      notificationDimensions.borderWidth,

    borderColor: colors.primary,

    borderRadius:
      notificationDimensions.cardRadius,

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

  /* Total */

  totalContainer: {
    width: "100%",

    alignItems: "flex-end",

    marginBottom: 10,
  },

  totalText: {
    color: colors.textSecondary,
  },

  totalNumber: {
    color: colors.text,
    fontWeight: "700",
  },

  /* Controls */

  controlsContainer: {
    width: "100%",

    flexDirection: "row",

    alignItems: "center",

    gap: 8,

    marginBottom: 20,

    zIndex: 100,
  },

  dropdownWrapper: {
    position: "relative",

    flex: 1,

    zIndex: 100,
  },

  dropdownButton: {
    minHeight:
      notificationDimensions.filterHeight,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 6,

    paddingHorizontal: 10,

    backgroundColor: colors.glass.white,

    borderWidth: 2,

    borderColor: colors.primary,

    borderRadius:
      notificationDimensions.filterRadius,
  },

  dropdownButtonText: {
    color: colors.text,

    fontWeight: "600",

    flexShrink: 1,
  },

  /* Mark as Read */

  markReadButton: {
    minHeight:
      notificationDimensions.filterHeight,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 5,

    paddingHorizontal: 12,

    backgroundColor: colors.primary,

    borderRadius:
      notificationDimensions.buttonRadius,
  },

  markReadText: {
    color: colors.onPrimary,

    fontWeight: "700",
  },

  /* Sections */

  section: {
    width: "100%",
  },

  sectionTitle: {
    color: colors.text,

    fontWeight: "700",

    marginBottom: 10,
  },

  /* Notification List */

  notificationList: {
    width: "100%",

    gap: 12,
  },
});