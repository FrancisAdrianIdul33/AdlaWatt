import AnalyticsCards from "@/components/AnalyticsCard";
import Copyright from "@/components/ui/Copyright";
import NavBar from "@/components/layout/Navbar";
import ScreenContainer2 from "@/components/layout/ScreenContainer2";
import AppText from "@/components/ui/AppText";
import AnalyticsChartCard from "@/components/AnalyticsChartCard";
import BatteryLevelChart, {
  BatteryLevelPoint,
} from "@/components/charts/BatteryLevelChart";
import UnsafeDischargeChart from "@/components/charts/UnsafeDischargeChart";
import {
  DropdownModal,
  RadioOptionRow,
} from "@/components/ui/DropdownModal";
import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";
import {
  AnalyticsRange,
  ApplianceUsageHistoryRow,
  ChartFrequency,
  MonitoringHistoryRow,
  REPORT_FREQUENCIES,
  ReportFrequency,
  ReportType,
  createAnalyticsReportContent,
  downloadCsvOnWeb,
  downloadPdfOnWeb,
  generateAdlaWattCsv,
  generateAdlaWattPdf,
  getBatteryChartRangeData,
  getDefaultRange,
  getUnsafeDischargeChartData,
  groupMonitoringHistory,
  loadAnalyticsData,
  prepareReportData,
  type UnsafeBarPoint,
} from "@/services/analyticsService";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Alert,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from "react-native";

/* ============================================================
   SCREEN
   ============================================================ */

export default function AnalyticsScreen() {
  const colors = useAppColors();

  const styles = useMemo(
    () => getStyles(colors),
    [colors],
  );

  const [
    monitoringHistory,
    setMonitoringHistory,
  ] = useState<MonitoringHistoryRow[]>([]);

  const [
    applianceUsageHistory,
    setApplianceUsageHistory,
  ] = useState<ApplianceUsageHistoryRow[]>([]);

  const [
    reportFrequency,
    setReportFrequency,
  ] = useState<ReportFrequency>(
    "Daily",
  );

  const [
    reportModalVisible,
    setReportModalVisible,
  ] = useState(false);

  const [
    range,
    setRange,
  ] = useState<AnalyticsRange>(
    getDefaultRange(),
  );

  const [
    batteryFrequency,
    setBatteryFrequency,
  ] = useState<ChartFrequency>(
    "Daily",
  );

  const [
    unsafeFrequency,
    setUnsafeFrequency,
  ] = useState<ChartFrequency>(
    "Daily",
  );

  const batteryPoints =
    useMemo<BatteryLevelPoint[]>(() => {
      const buckets =
        groupMonitoringHistory(
          monitoringHistory,
          batteryFrequency,
        );

      return getBatteryChartRangeData(
        buckets,
        batteryFrequency,
      );
    }, [
      monitoringHistory,
      batteryFrequency,
    ]);

  const unsafePoints =
    useMemo<UnsafeBarPoint[]>(() => {
      const buckets =
        groupMonitoringHistory(
          monitoringHistory,
          unsafeFrequency,
        );

      return getUnsafeDischargeChartData(
        buckets,
        unsafeFrequency,
      );
    }, [
      monitoringHistory,
      unsafeFrequency,
    ]);

  const loadAnalytics =
    useCallback(
      async () => {
        const {
          monitoringHistory:
          monitoringRows,
          applianceUsageHistory:
          applianceRows,
        } = await loadAnalyticsData(
          range,
        );

        setMonitoringHistory(
          monitoringRows,
        );

        setApplianceUsageHistory(
          applianceRows,
        );
      },
      [range],
    );

  useEffect(() => {
    loadAnalytics();
  }, [
    loadAnalytics,
  ]);

  /* ==========================================================
     REPORT
     ========================================================== */

  const generateReport =
    useCallback(
      async (
        reportType: ReportType,
      ) => {
        if (
          monitoringHistory.length ===
          0 &&
          applianceUsageHistory.length ===
          0
        ) {
          Alert.alert(
            "No Data",
            "There is no historical analytics data available for the selected date range.",
          );

          return;
        }

        /* ======================================================
           WEB EXPORT
           ====================================================== */

        if (
          Platform.OS === "web"
        ) {
          try {
            const reportData =
              prepareReportData(
                monitoringHistory,
                applianceUsageHistory,
                reportFrequency,
                range,
              );

            if (
              reportType === "CSV"
            ) {
              const csv =
                generateAdlaWattCsv(
                  reportData,
                );

              const filename =
                `adlawatt_${reportFrequency.toLowerCase()}_report_${new Date()
                  .toISOString()
                  .slice(0, 10)}.csv`;

              downloadCsvOnWeb(
                csv,
                filename,
              );

              return;
            }

            const pdf =
              await generateAdlaWattPdf(
                reportData,
              );

            const filename =
              `adlawatt_${reportFrequency.toLowerCase()}_report_${new Date()
                .toISOString()
                .slice(0, 10)}.pdf`;

            downloadPdfOnWeb(
              pdf,
              filename,
            );

            return;
          } catch (error) {
            console.error(
              "Web report export error:",
              error,
            );

            Alert.alert(
              "Export Error",
              "The report could not be generated.",
            );

            return;
          }
        }

        /* ======================================================
           NATIVE ANDROID / IOS EXPORT
           ====================================================== */

        const {
          reportHeader,
          reportContent,
        } =
          createAnalyticsReportContent(
            monitoringHistory,
            applianceUsageHistory,
            reportFrequency,
            range,
          );

        if (
          reportType === "CSV"
        ) {
          await Share.share({
            message:
              reportContent,

            title:
              "AdlaWatt Analytics CSV Report",
          });

          return;
        }

        await Share.share({
          message: [
            reportHeader,
            "",
            "PDF export preparation",
            "",
            `Monitoring records: ${monitoringHistory.length}`,
            `Appliance usage records: ${applianceUsageHistory.length}`,
            "",
            "This report contains the selected historical analytics data.",
          ].join("\n"),

          title:
            "AdlaWatt Analytics Report",
        });
      },
      [
        monitoringHistory,
        applianceUsageHistory,
        reportFrequency,
        range,
      ],
    );

  /* ==========================================================
     DATE RANGE
     ========================================================== */

  const setFromDate =
    useCallback(
      (
        date: Date,
      ) => {
        setRange(
          (currentRange) => {
            const today =
              new Date();

            const from =
              new Date(
                Math.min(
                  date.getTime(),
                  today.getTime(),
                ),
              );

            const end =
              from.getTime() >
              currentRange.end.getTime()
                ? from
                : currentRange.end;

            return {
              start: from,
              end,
            };
          },
        );
      },
      [],
    );

  const setToDate =
    useCallback(
      (
        date: Date,
      ) => {
        setRange(
          (currentRange) => {
            const today =
              new Date();

            const to =
              new Date(
                Math.min(
                  date.getTime(),
                  today.getTime(),
                ),
              );

            const end =
              to.getTime() <
              currentRange.start.getTime()
                ? currentRange.start
                : to;

            return {
              start:
                currentRange.start,
              end,
            };
          },
        );
      },
      [],
    );

  return (
    <ScreenContainer2>
      {/* Fixed Navbar */}
      <NavBar />

      <ScrollView
        style={
          styles.scrollView
        }
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* ======================================================
            ANALYTICS HEADER
        ====================================================== */}
        <View
          style={
            styles.headerCard
          }
        >
          <AppText
            variant="heading"
            style={
              styles.headerTitle
            }
          >
            Analytics & Trends
          </AppText>

          <AppText
            variant="caption"
            style={
              styles.headerSubtitle
            }
          >
            Analyze system performance,
            energy usage, temperature,
            and appliance data over time.
          </AppText>
        </View>

        {/* ======================================================
            ANALYTICS CHARTS
        ====================================================== */}
        <AnalyticsChartCard
          title="Battery Level Over Time"
          subtitle="Average battery level per period, with the 20% safety floor marked."
          icon="battery-half-outline"
          frequency={batteryFrequency}
          onFrequencyChange={
            setBatteryFrequency
          }
        >
          <BatteryLevelChart
            points={batteryPoints}
          />
        </AnalyticsChartCard>

        <AnalyticsChartCard
          title="Unsafe Discharge Events"
          subtitle="Snapshots below 20% per period. Lower is better."
          icon="warning-outline"
          frequency={unsafeFrequency}
          onFrequencyChange={
            setUnsafeFrequency
          }
        >
          <UnsafeDischargeChart
            points={unsafePoints}
          />
        </AnalyticsChartCard>

        {/* ======================================================
            ANALYTICS PANEL
            Report export + date-range controls.
        ====================================================== */}
        <AnalyticsCards
          reportFrequency={
            reportFrequency
          }
          setReportModalVisible={
            setReportModalVisible
          }
          range={range}
          onFromDateChange={
            setFromDate
          }
          onToDateChange={
            setToDate
          }
          generateReport={
            generateReport
          }
        />

        {/* Copyright */}
        <Copyright />
      </ScrollView>

      {/* ========================================================
          REPORT FREQUENCY MODAL
      ======================================================== */}
      <DropdownModal
        visible={reportModalVisible}
        title="Report Frequency"
        onClose={() =>
          setReportModalVisible(false)
        }
      >
        {REPORT_FREQUENCIES.map(
          (option) => (
            <RadioOptionRow
              key={option}
              label={option}
              selected={
                reportFrequency ===
                option
              }
              onPress={() => {
                setReportFrequency(
                  option,
                );

                setReportModalVisible(
                  false,
                );
              }}
            />
          ),
        )}
      </DropdownModal>
    </ScreenContainer2>
  );
}

/* ============================================================
   DIMENSIONS
   ============================================================ */

const analyticsDimensions = {
  horizontalPadding: 16,
  sectionSpacing: 18,

  /*
   * These values are intentionally preserved
   * from the previous Analytics header.
   */

  headerRadius: 16,
  headerBorderWidth: 3,
  contentBottomPadding: 24,
};

/* ============================================================
   STYLES
   ============================================================ */

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    /* ========================================================
       MAIN SCREEN
    ======================================================== */

    scrollView: {
      flex: 1,
      backgroundColor:
        colors.background,
    },

    content: {
      paddingHorizontal:
        analyticsDimensions.horizontalPadding,
      paddingTop:
        analyticsDimensions.sectionSpacing,
      paddingBottom:
        analyticsDimensions.contentBottomPadding,
    },

    /* ========================================================
       ANALYTICS HEADER
    ======================================================== */

    headerCard: {
      backgroundColor:
        colors.glass.white,
      borderWidth:
        analyticsDimensions.headerBorderWidth,
      borderColor:
        colors.cardBorder,
      borderRadius:
        analyticsDimensions.headerRadius,
      padding: 18,
      marginBottom: 20,
    },

    headerTitle: {
      color: colors.text,
      fontWeight: "700",
    },

    headerSubtitle: {
      color:
        colors.textSecondary,
      marginTop: 6,
      lineHeight: 20,
    },
  });