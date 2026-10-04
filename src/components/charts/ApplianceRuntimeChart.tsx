import {
  useMemo,
} from "react";
import {
  StyleSheet,
  View,
} from "react-native";
import {
  BarChart,
} from "react-native-gifted-charts";
import {
  CHART_HEIGHT,
  niceCeil,
  useChartColors,
} from "@/services/chartMath";
import { useTypography } from "@/hooks/useTypography";
import { useAppColors } from "@/hooks/useAppColors";
import AppText from "@/components/ui/AppText";
import type {
  ApplianceShareSlice,
} from "@/services/analyticsService";

/* ============================================================
   CONSTANTS
   ============================================================ */

const BAR_HEIGHT = 18;
const BAR_SPACING = 14;
// Category rail: appliance names need far more room than the
// standard 38px numeric rail — documented deviation, same -10
// card bleed so the left gap still matches other cards.
const Y_AXIS_W = 96;
const SECTIONS = 4;
const MAX_NAME_LENGTH = 12;

/* ============================================================
   SMALL UI PIECES
   ============================================================ */

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.stat}>
      <AppText
        variant="caption"
        style={styles.statLabel}
      >
        {label}
      </AppText>

      <AppText
        variant="heading"
        style={[styles.statValue, { color }]}
      >
        {value}
      </AppText>
    </View>
  );
}

// Compact duration: 8100 -> "2h 15m", 2700 -> "45m", 50 -> "50s".
function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;

  if (minutes < 60) {
    return rest > 0 ? `${minutes}m ${rest}s` : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;

  return restMinutes > 0
    ? `${hours}h ${restMinutes}m`
    : `${hours}h`;
}

/* ============================================================
   APPLIANCE RUN TIME
   Horizontal yellow bars of total run time per appliance, sorted
   longest-first (react-native-gifted-charts, SVG-based so it
   works on native and web with no extra engine loading). Shares
   the range-total grouping with Energy by Appliance (same memo,
   no toggle). Names own the category rail, durations own the bar
   ends and stats — nothing repeats.
   Empty until the app records appliance usage: axes plus a note
   naming the cause, never placeholder data.
   Do NOT wrap this component in a horizontal ScrollView.
   ============================================================ */

export default function ApplianceRuntimeChart({
  slices,
}: {
  slices: ApplianceShareSlice[];
}) {
  const { family } = useTypography();
  const chartColors = useChartColors();
  const colors = useAppColors();

  const ordered = useMemo(
    () =>
      [...slices]
        .map((slice) => ({
          name: slice.name,
          durationSeconds: Math.max(
            0,
            slice.durationSeconds,
          ),
        }))
        .filter((slice) => slice.durationSeconds > 0)
        .sort(
          (a, b) => b.durationSeconds - a.durationSeconds,
        ),
    [slices],
  );
  const isEmpty = ordered.length === 0;

  // Dynamic value axis: nice ceiling over the longest runtime.
  const top = isEmpty
    ? 10
    : niceCeil(
        Math.max(...ordered.map((s) => s.durationSeconds)),
      );

  const data = useMemo(
    () =>
      isEmpty
        ? [
            { value: 0, label: "" },
            { value: 0, label: "" },
          ]
        : ordered.map((slice) => ({
            value: slice.durationSeconds,
            label:
              slice.name.length > MAX_NAME_LENGTH
                ? `${slice.name.slice(0, MAX_NAME_LENGTH - 1)}…`
                : slice.name,
            frontColor: chartColors.yellow,
            topLabelComponent: () => (
              <AppText
                variant="caption"
                style={styles.barValue}
              >
                {formatDuration(slice.durationSeconds)}
              </AppText>
            ),
          })),
    [ordered, isEmpty, chartColors],
  );

  // Vertical extent grows with the bar count; the chart takes
  // the parent width by default (horizontal charts are rotated
  // vertical charts, so height here is the vertical extent).
  const chartHeight = Math.max(
    CHART_HEIGHT,
    ordered.length * (BAR_HEIGHT + BAR_SPACING) + 72,
  );

  // Stats: longest (name + duration) and total runtime —
  // per-slice durations live on the bars only.
  const longest = isEmpty ? null : ordered[0];
  const total = isEmpty
    ? null
    : ordered.reduce(
        (sum, slice) => sum + slice.durationSeconds,
        0,
      );

  return (
    <View style={styles.container}>
      {/* Stats: text labels, not color only. */}
      <View style={styles.statsRow}>
        <Stat
          label="Longest"
          value={
            longest != null
              ? `${longest.name} ${formatDuration(longest.durationSeconds)}`
              : "-"
          }
          color={colors.text}
        />

        <Stat
          label="Total runtime"
          value={
            total != null ? formatDuration(total) : "-"
          }
          color={colors.text}
        />
      </View>

      <View
        style={styles.chartWrap}
      >
        {isEmpty ? (
          <View style={{ height: CHART_HEIGHT }} />
        ) : (
          <BarChart
            key={`appliance-runtime-${data.length}`}
            data={data}
            horizontal
            height={chartHeight}
            barWidth={BAR_HEIGHT}
            barBorderRadius={4}
            frontColor={chartColors.yellow}
            maxValue={top}
            noOfSections={SECTIONS}
            yAxisLabelWidth={Y_AXIS_W}
            formatYLabel={(label: string) =>
              formatDuration(Number(label))
            }
            yAxisThickness={0}
            xAxisThickness={0}
            yAxisTextStyle={{
              fontSize: 12,
              fontFamily: family,
              color: chartColors.axisLabel,
            }}
            xAxisColor={chartColors.grid}
            xAxisLabelTextStyle={{
              fontSize: 12,
              fontFamily: family,
              color: chartColors.axisLabel,
            }}
            intactTopLabel
            rulesType="solid"
            rulesColor={chartColors.grid}
            rulesThickness={1}
            showVerticalLines={false}
            spacing={BAR_SPACING}
            initialSpacing={12}
            endSpacing={12}
            showScrollIndicator={false}
          />
        )}
      </View>

      {isEmpty ? (
        <AppText
          variant="caption"
          style={styles.emptyNote}
        >
          No appliance records yet —
          usage logging will fill this card.
        </AppText>
      ) : null}

      {/* Legend: color + text so meaning never depends
          on color alone. */}
      <View
        style={styles.legend}
        accessibilityRole="text"
        accessibilityLabel="Legend: yellow bars appliance run time"
      >
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendSwatch,
              { backgroundColor: chartColors.yellow },
            ]}
          />

          <AppText
            variant="caption"
            style={styles.legendText}
          >
            Runtime
          </AppText>
        </View>
      </View>
    </View>
  );
}

/* ============================================================
   STYLES
   ============================================================ */

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  stat: {
    flex: 1,
    alignItems: "center",
  },

  statLabel: {
    fontSize: 11,
    textAlign: "center",
  },

  statValue: {
    fontSize: 20,
    fontVariant: ["tabular-nums"],
    textAlign: "center",
  },

  chartWrap: {
    width: "100%",
    marginLeft: -10,
  },

  barValue: {
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },

  emptyNote: {
    marginTop: 8,
    textAlign: "center",
  },

  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    gap: 14,
    marginTop: 10,
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  legendSwatch: {
    width: 18,
    height: 10,
    borderRadius: 2,
  },

  legendText: {
    fontSize: 12,
  },
});
