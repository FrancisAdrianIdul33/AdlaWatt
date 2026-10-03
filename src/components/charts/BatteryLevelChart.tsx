import {
  useMemo,
  useState,
} from "react";
import {
  LayoutChangeEvent,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import {
  LineChart,
} from "react-native-gifted-charts";
import {
  CHART_HEIGHT,
  clampPercent,
  useChartColors,
} from "@/services/chartMath";
import { useTypography } from "@/hooks/useTypography";
import { useAppColors } from "@/hooks/useAppColors";
import AppText from "@/components/ui/AppText";

/* ============================================================
   CONSTANTS
   ============================================================ */

const DEFAULT_POINT_WIDTH = 60;
const Y_AXIS_W = 46; // width reserved for the fixed % labels
const DEFAULT_FLOOR = 20; // safety floor in %

/* ============================================================
   TYPES
   ============================================================ */

export interface BatteryLevelPoint {
  value: number;
  min?: number;
  max?: number;
  label?: string;
}

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

/* ============================================================
   BATTERY LEVEL OVER TIME
   Curved area chart (react-native-gifted-charts, SVG-based so it
   works on native and web with no extra engine loading).
   The Y axis is always 0 to 100%. The chart is the VISIBLE
   width only, so gifted-charts scrolls the plot inside and
   the left % axis stays fixed while lines terminate at the
   bare right edge. A 20px margin at each end keeps the
   edge date labels fully readable. The chart remounts when changes so the
   view opens at the newest data via scrollToEnd. Drag-scroll
   works inside the plot on web and native. Dashed floor line
   (legend explains it, no in-chart label), centered text
   legend, and axes-always-render empty state are kept. Area
   fill is softened in dark mode to avoid glow.
   Do NOT wrap this component in a horizontal ScrollView.
   ============================================================ */

export default function BatteryLevelChart({
  points,
  pointWidth = DEFAULT_POINT_WIDTH,
  floor = DEFAULT_FLOOR,
}: {
  points: BatteryLevelPoint[];
  pointWidth?: number;
  floor?: number;
}) {
  // Family-only: axis sizes stay 12 by design, only the
  // typeface follows Preferences.
  const { family } = useTypography();
  // Series colors frozen; grid/axis neutrals follow theme.
  const chartColors = useChartColors();
  const colors = useAppColors();

  const [boxW, setBoxW] = useState(0);

  const onLayout = (e: LayoutChangeEvent) =>
    setBoxW(e.nativeEvent.layout.width);

  // Skip non-finite values (periods with no data).
  const real = useMemo(
    () =>
      points.filter(
        (p): p is BatteryLevelPoint & { value: number } =>
          Number.isFinite(p.value),
      ),
    [points],
  );
  const isEmpty = real.length < 2;

  // Y range is always the full 0 to 100%.
  const offset = 0;
  const top = 100;
  const range = top - offset;
  const sections = 5;
  const showFloor = floor >= offset && floor <= top;

  // Chart data on the 0-100 scale.
  const data = useMemo(
    () =>
      isEmpty
        ? [
            { value: 0, label: "" },
            { value: 0, label: "" },
          ]
        : real.map((p) => ({
            value: clampPercent(p.value),
            label: p.label ?? "",
          })),
    [real, isEmpty],
  );

  // Layout numbers: visible plot width only, so the plot
  // scrolls inside and the % labels stay in place.
  const chartW = Math.max(boxW - Y_AXIS_W - 4, 120);
  const spacing = isEmpty
    ? Math.max(chartW - 36, 40)
    : Math.max(pointWidth, (chartW - 36) / (real.length - 1));

  // Stats.
  const latest = isEmpty ? null : real[real.length - 1].value;
  const lowest = isEmpty
    ? null
    : Math.min(...real.map((p) => p.value));
  const average = isEmpty
    ? null
    : real.reduce((sum, p) => sum + p.value, 0) / real.length;
  const belowFloor = lowest != null && lowest < floor;

  return (
    <View style={styles.container}>
      {/* Stats: text labels, not color only. */}
      <View style={styles.statsRow}>
        <Stat
          label="Latest"
          value={
            latest != null ? `${Math.round(latest)}%` : "-"
          }
          color={colors.text}
        />

        <Stat
          label="Average"
          value={
            average != null ? `${Math.round(average)}%` : "-"
          }
          color={colors.text}
        />

        <Stat
          label={
            belowFloor ? "Lowest (below floor)" : "Lowest"
          }
          value={
            lowest != null ? `${Math.round(lowest)}%` : "-"
          }
          color={belowFloor ? chartColors.red : colors.text}
        />
      </View>

      {/* Chart row: plot (measured, flex-1) + plain right wall.
          The row always renders so onLayout can measure; only
          the LineChart waits for the real width (placeholder
          keeps the height meanwhile). The plot scrolls inside
          the chart on web and native; both % rails stay fixed.
          The chart remounts when the point count changes so
          scrollToEnd opens at the newest data. */}
      <View
        onLayout={onLayout}
        style={styles.chartWrap}
      >
        {boxW > 0 ? (
          <LineChart
            key={`battery-${data.length}`}
            data={data}
            height={CHART_HEIGHT}
            width={chartW}
            curved
            areaChart
            color={chartColors.green}
            thickness={3}
            startFillColor={chartColors.green}
            endFillColor={chartColors.green}
            startOpacity={colors.isDark ? 0.22 : 0.32}
            endOpacity={0.02}
            maxValue={range}
            noOfSections={sections}
            yAxisLabelWidth={Y_AXIS_W}
            formatYLabel={(label: string) =>
              `${Math.round(Number(label) + offset)}%`
            }
            yAxisThickness={0}
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
            rulesType="solid"
            rulesColor={chartColors.grid}
            rulesThickness={1}
            showVerticalLines={false}
            hideDataPoints={isEmpty || Platform.OS === "web"}
            dataPointsColor={chartColors.green}
            dataPointsRadius={3}
            spacing={spacing}
            initialSpacing={20}
            endSpacing={0}
            showReferenceLine1={showFloor}
            referenceLine1Position={floor - offset}
            referenceLine1Config={{
              color: chartColors.red,
              thickness: 1.5,
              type: "dashed",
              dashWidth: 4,
              dashGap: 4,
            }}
            showScrollIndicator={false}
            scrollToEnd
            scrollAnimation={false}
          />
        ) : (
          <View style={{ height: CHART_HEIGHT }} />
        )}
      </View>

      {/* Legend: line style + text so meaning never depends
          on color alone (solid green = battery %, dashed red
          = safety floor). */}
      <View
        style={styles.legend}
        accessibilityRole="text"
        accessibilityLabel="Legend: solid line battery percent, dashed line safety floor"
      >
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendSwatch,
              { backgroundColor: chartColors.green },
            ]}
          />

          <AppText
            variant="caption"
            style={styles.legendText}
          >
            Battery %
          </AppText>
        </View>

        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendSwatchDashed,
              { borderColor: chartColors.red },
            ]}
          />

          <AppText
            variant="caption"
            style={styles.legendText}
          >
            {`${floor}% safety floor${
              !showFloor && !isEmpty ? " (below this view)" : ""
            }`}
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
  },

  statLabel: {
    fontSize: 11,
  },

  statValue: {
    fontSize: 20,
    fontVariant: ["tabular-nums"],
  },

  chartWrap: {
    width: "100%",
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
    height: 3,
    borderRadius: 2,
  },

  legendSwatchDashed: {
    width: 18,
    height: 0,
    borderTopWidth: 2,
    borderStyle: "dashed",
  },

  legendText: {
    fontSize: 12,
  },
});
