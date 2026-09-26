import { Ionicons } from "@expo/vector-icons";

import React, {
  useMemo,
  useState,
} from "react";

import {
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import AppText from "@/components/ui/AppText";
import {
  DropdownModal,
} from "@/components/ui/DropdownModal";

import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";

// ============================================================
// CUSTOM CALENDAR VIEWER
//
// Rendered inside the shared DropdownModal shell so the date
// picker matches every other dropdown: same overlay, same card,
// same header. The calendar itself is a fully custom month grid
// shared across web, iOS, and Android (no native picker).
// ============================================================

const WEEKDAYS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

const GRID_CELLS = 42; // 6 rows x 7 columns

// ============================================================
// TYPES
// ============================================================

export interface CalendarDayCell {
  date: Date;
  isToday: boolean;
  isSelected: boolean;
  isFuture: boolean;
}

interface CalendarModalProps {
  visible: boolean;
  title: string;
  value: Date;
  maximumDate?: Date;
  onChange: (date: Date) => void;
  onClose: () => void;
}

// ============================================================
// DATE HELPERS
// ============================================================

function startOfDay(
  date: Date,
): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
}

function startOfMonth(
  date: Date,
): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1,
  );
}

function addMonths(
  date: Date,
  amount: number,
): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth() + amount,
    1,
  );
}

function isSameDay(
  left: Date,
  right: Date,
): boolean {
  return (
    left.getFullYear() ===
      right.getFullYear() &&
    left.getMonth() ===
      right.getMonth() &&
    left.getDate() ===
      right.getDate()
  );
}

function buildMonthDays(
  monthStart: Date,
  selected: Date,
  maximumDate: Date,
): (CalendarDayCell | null)[] {
  const today =
    startOfDay(new Date());

  const maxDay =
    startOfDay(maximumDate);

  const leadingBlanks =
    monthStart.getDay();

  const daysInMonth =
    new Date(
      monthStart.getFullYear(),
      monthStart.getMonth() + 1,
      0,
    ).getDate();

  const cells: (
    CalendarDayCell | null
  )[] = [];

  for (
    let index = 0;
    index < GRID_CELLS;
    index += 1
  ) {
    const dayNumber =
      index - leadingBlanks +
      1;

    if (
      dayNumber < 1 ||
      dayNumber > daysInMonth
    ) {
      cells.push(null);

      continue;
    }

    const date =
      new Date(
        monthStart.getFullYear(),
        monthStart.getMonth(),
        dayNumber,
      );

    cells.push({
      date,
      isToday:
        isSameDay(date, today),
      isSelected:
        isSameDay(date, selected),
      isFuture: date > maxDay,
    });
  }

  return cells;
}

// ============================================================
// COMPONENT
// ============================================================

export function CalendarModal({
  visible,
  title,
  value,
  maximumDate,
  onChange,
  onClose,
}: CalendarModalProps) {
  const maximum =
    useMemo(
      () =>
        maximumDate ??
        new Date(),
      [maximumDate],
    );

  const [viewMonth, setViewMonth] =
    useState(() =>
      startOfMonth(value),
    );

  const colors = useAppColors();

  const styles = useMemo(
    () => getStyles(colors),
    [colors],
  );

  const cells =
    useMemo(
      () =>
        buildMonthDays(
          viewMonth,
          value,
          maximum,
        ),
      [
        viewMonth,
        value,
        maximum,
      ],
    );

  const canGoNext =
    viewMonth.getFullYear() <
      maximum.getFullYear() ||
    (
      viewMonth.getFullYear() ===
        maximum.getFullYear() &&
      viewMonth.getMonth() <
        maximum.getMonth()
    );

  const monthLabel =
    viewMonth.toLocaleDateString(
      "en-US",
      {
        month: "long",
        year: "numeric",
      },
    );

  return (
    <DropdownModal
      visible={visible}
      title={title}
      onClose={onClose}
    >
      {/* ==================================================
          MONTH NAVIGATION
          ================================================== */}

      <View
        style={
          styles.monthNav
        }
      >
        <Pressable
          onPress={() =>
            setViewMonth(
              (currentMonth) =>
                addMonths(
                  currentMonth,
                  -1,
                ),
            )
          }
          style={({ pressed }) => [
            styles.navButton,
            pressed &&
              styles.buttonPressed,
          ]}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={
              colors.primary
            }
          />
        </Pressable>

        <AppText
          variant="caption"
          style={
            styles.monthLabel
          }
        >
          {monthLabel}
        </AppText>

        <Pressable
          onPress={
            canGoNext
              ? () =>
                  setViewMonth(
                    (currentMonth) =>
                      addMonths(
                        currentMonth,
                        1,
                      ),
                  )
              : undefined
          }
          disabled={!canGoNext}
          style={({ pressed }) => [
            styles.navButton,
            !canGoNext &&
              styles.navButtonDisabled,
            pressed &&
              styles.buttonPressed,
          ]}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={
              canGoNext
                ? colors.primary
                : colors.border
            }
          />
        </Pressable>
      </View>

      {/* ==================================================
          WEEKDAY HEADER
          ================================================== */}

      <View
        style={
          styles.weekRow
        }
      >
        {WEEKDAYS.map((weekday) => (
          <View
            key={weekday}
            style={
              styles.dayCellSlot
            }
          >
            <AppText
              variant="caption"
              style={
                styles.weekdayLabel
              }
            >
              {weekday}
            </AppText>
          </View>
        ))}
      </View>

      {/* ==================================================
          DAY GRID
          ================================================== */}

      <View
        style={
          styles.dayGrid
        }
      >
        {cells.map((cell, index) => (
          <View
            key={index}
            style={
              styles.dayCellSlot
            }
          >
            {cell && (
              <Pressable
                onPress={() => {
                  onChange(
                    cell.date,
                  );

                  onClose();
                }}
                disabled={
                  cell.isFuture
                }
                style={({ pressed }) => [
                  styles.dayCell,
                  cell.isToday &&
                    styles.todayCell,
                  cell.isSelected &&
                    styles.selectedCell,
                  cell.isFuture &&
                    styles.futureCell,
                  pressed &&
                    styles.buttonPressed,
                ]}
              >
                <AppText
                  variant="caption"
                  style={[
                    styles.dayText,
                    cell.isSelected &&
                      styles.selectedDayText,
                    cell.isFuture &&
                      styles.futureDayText,
                  ]}
                >
                  {cell.date.getDate()}
                </AppText>
              </Pressable>
            )}
          </View>
        ))}
      </View>
    </DropdownModal>
  );
}

// ============================================================
// STYLES
// ============================================================

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    monthNav: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      marginTop: 4,
      marginBottom: 6,
    },

    navButton: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 12,
    },

    navButtonDisabled: {
      opacity: 0.4,
    },

    monthLabel: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "700",
      flexShrink: 1,
      textAlign: "center",
    },

    weekRow: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },

    weekdayLabel: {
      color:
        colors.textSecondary,
      fontSize: 12,
      fontWeight: "600",
      textAlign: "center",
    },

    dayGrid: {
      width: "100%",
      flexDirection: "row",
      flexWrap: "wrap",
    },

    dayCellSlot: {
      width: `${100 / 7}%`,
      height: 46,
      alignItems: "center",
      justifyContent: "center",
    },

    dayCell: {
      width: 42,
      height: 42,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 21,
    },

    todayCell: {
      borderWidth: 2,
      borderColor:
        colors.primary,
    },

    selectedCell: {
      backgroundColor:
        colors.primary,
    },

    futureCell: {
      opacity: 0.35,
    },

    dayText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "600",
      textAlign: "center",
    },

    selectedDayText: {
      color: colors.onPrimary,
      fontWeight: "700",
    },

    futureDayText: {
      color:
        colors.textSecondary,
    },

    buttonPressed: {
      opacity: 0.7,
    },
  });