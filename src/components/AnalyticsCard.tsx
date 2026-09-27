import React, {
  useMemo,
  useState,
} from "react";
import {
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppText from "@/components/ui/AppText";
import {
  CalendarModal,
} from "@/components/ui/CalendarModal";
import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";
import {
  AnalyticsRange,
  ReportFrequency,
  ReportType,
  formatReportDate,
} from "@/services/analyticsService";
import { Control, OptionRow } from "@/constants/sizing";

/* ============================================================
   DATE PICKER
   ============================================================ */

interface DatePickerFieldProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
}

function DatePickerField({
  label,
  value,
  onChange,
}: DatePickerFieldProps) {
  const [
    calendarVisible,
    setCalendarVisible,
  ] = useState(false);

  const colors = useAppColors();

  const styles = useMemo(
    () => getStyles(colors),
    [colors],
  );

  return (
    <View
      style={
        styles.reportControl
      }
    >
      <AppText
        variant="caption"
        style={
          styles.reportControlLabel
        }
      >
        {label}
      </AppText>

      <Pressable
        style={({ pressed }) => [
          styles.dateFieldButton,
          pressed &&
            styles.buttonPressed,
        ]}
        onPress={() =>
          setCalendarVisible(true)
        }
      >
        <AppText
          variant="caption"
          style={
            styles.dateFieldText
          }
        >
          {formatReportDate(value)}
        </AppText>

        <Ionicons
          name="calendar-outline"
          size={16}
          color={colors.primary}
        />
      </Pressable>

      <CalendarModal
        visible={calendarVisible}
        title={label}
        value={value}
        maximumDate={new Date()}
        onChange={onChange}
        onClose={() =>
          setCalendarVisible(false)
        }
      />
    </View>
  );
}

/* ============================================================
   PROPS
   ============================================================ */

export interface AnalyticsCardsProps {
  reportFrequency: ReportFrequency;
  setReportModalVisible: React.Dispatch<
    React.SetStateAction<boolean>
  >;
  range: AnalyticsRange;
  onFromDateChange: (date: Date) => void;
  onToDateChange: (date: Date) => void;
  generateReport: (
    reportType: ReportType,
  ) => Promise<void>;
}

/* ============================================================
   ANALYTICS PANEL
   ============================================================ */

export default function AnalyticsCards({
  reportFrequency,
  setReportModalVisible,
  range,
  onFromDateChange,
  onToDateChange,
  generateReport,
}: AnalyticsCardsProps) {
  const colors = useAppColors();

  const styles = useMemo(
    () => getStyles(colors),
    [colors],
  );

  return (
    <>
      {/* ======================================================
          GENERATE REPORT
          Follows the ChartCard grouped-card layout: a solid
          primary header accent panel over the body content.
      ====================================================== */}

      <View
        style={
          styles.reportCard
        }
      >
        {/* Header / Accent Panel */}
        <View
          style={
            styles.reportHeaderPanel
          }
        >
          <Ionicons
            name="document-text-outline"
            size={30}
            color={colors.iconAccent}
          />

          <AppText
            variant="heading"
            style={
              styles.reportHeaderTitle
            }
          >
            Generate Report
          </AppText>
        </View>

        {/* Body */}
        <View
          style={
            styles.reportBody
          }
        >
          <AppText
            variant="caption"
            style={
              styles.reportSubtitle
            }
          >
            Choose a frequency and pick a custom from/to date range
            for the report export.
          </AppText>

          <View
            style={
              styles.reportControls
            }
          >
            <View
              style={
                styles.reportControl
              }
            >
              <AppText
                variant="caption"
                style={
                  styles.reportControlLabel
                }
              >
                Frequency
              </AppText>

              <Pressable
                style={({ pressed }) => [
                  styles.reportSelect,
                  pressed &&
                    styles.buttonPressed,
                ]}
                onPress={() =>
                  setReportModalVisible(
                    true,
                  )
                }
              >
                <AppText
                  variant="caption"
                  style={
                    styles.reportSelectText
                  }
                >
                  {reportFrequency}
                </AppText>

                <Ionicons
                  name="chevron-down-outline"
                  size={15}
                  color={
                    colors.primary
                  }
                />
              </Pressable>
            </View>

            <DatePickerField
              label="From Date"
              value={range.start}
              onChange={
                onFromDateChange
              }
            />

            <DatePickerField
              label="To Date"
              value={range.end}
              onChange={
                onToDateChange
              }
            />
          </View>

          <View
            style={
              styles.exportRow
            }
          >
            <Pressable
              style={({ pressed }) => [
                styles.exportPrimaryButton,
                pressed &&
                  styles.buttonPressed,
              ]}
              onPress={() =>
                generateReport(
                  "CSV",
                )
              }
            >
              <Ionicons
                name="download-outline"
                size={17}
                color={colors.onPrimary}
              />

              <AppText
                variant="caption"
                style={
                  styles.exportPrimaryText
                }
              >
                Export CSV
              </AppText>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.exportPrimaryButton,
                pressed &&
                  styles.buttonPressed,
              ]}
              onPress={() =>
                generateReport(
                  "PDF",
                )
              }
            >
              <Ionicons
                name="document-outline"
                size={17}
                color={colors.onPrimary}
              />

              <AppText
                variant="caption"
                style={
                  styles.exportPrimaryText
                }
              >
                Export PDF
              </AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </>
  );
}

/* ============================================================
   DIMENSIONS
   ============================================================ */

export const analyticsDimensions = {
  sectionSpacing: 18,
  cardRadius: 16,
  cardBorderWidth: 2,
};

/* ============================================================
   STYLES
   ============================================================ */

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    buttonPressed: {
      opacity: 0.72,
    },

    /* ========================================================
       REPORT CARD
    ======================================================== */

    reportCard: {
      width: "100%",
      backgroundColor:
        colors.glass.white,
      borderWidth: 3,
      borderColor:
        colors.primary,
      borderRadius: 15,
      flexDirection: "column",
      alignItems: "stretch",
      overflow: "hidden",
      marginBottom:
        analyticsDimensions.sectionSpacing,
    },

    reportHeaderPanel: {
      width: "100%",
      backgroundColor:
        colors.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "flex-start",
      paddingHorizontal: 14,
      paddingVertical: 9,
    },

    reportHeaderTitle: {
      color: colors.onPrimary,
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 8,
      flexShrink: 1,
    },

    reportBody: {
      padding: 16,
    },

    reportSubtitle: {
      color:
        colors.textSecondary,
      lineHeight: 19,
    },

    reportControls: {
      width: "100%",
      marginTop: 14,
      gap: 10,
    },

    reportControl: {
      width: "100%",
    },

    reportControlLabel: {
      color:
        colors.textSecondary,
      fontWeight: "600",
      marginBottom: 5,
    },

    reportSelect: {
      width: "100%",
      minHeight: OptionRow.minHeight,
      borderWidth: 2,
      borderColor:
        colors.primary,
      borderRadius: 12,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    reportSelectText: {
      color: colors.text,
      fontWeight: "600",
    },

    dateFieldButton: {
      width: "100%",
      minHeight: OptionRow.minHeight,
      backgroundColor:
        colors.washFaint,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
    },

    dateFieldText: {
      color: colors.text,
      fontWeight: "600",
    },

    exportRow: {
      width: "100%",
      flexDirection: "row",
      gap: 9,
      marginTop: 13,
    },

    exportPrimaryButton: {
      flex: 1,
      minHeight: Control.button,
      backgroundColor:
        colors.primary,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 7,
      paddingHorizontal: 10,
    },

    exportPrimaryText: {
      color: colors.onPrimary,
      fontWeight: "700",
    },
  });