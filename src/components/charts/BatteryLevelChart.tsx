import {
  useMemo,
} from "react";
import {
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
   BATTERY LEVEL OVER TIME
   Curved area chart (react-native-gifted-charts, SVG-based so it
   works on native and web with no extra engine loading). Y-axis is
   fixed 0-100 with a dashed red 20% safety floor. Axes always render,
   even without enough history. A text legend below the chart pairs
   each line style with its meaning so the 20% floor never relies
   on color alone. Area fill is softened in dark mode to avoid glow.
   ============================================================ */

export default function BatteryLevelChart({
  points,
  pointWidth = DEFAULT_POINT_WIDTH,
}: {
  points: BatteryLevelPoint[];
  pointWidth?: number;
}) {
  // Family-only: axis sizes stay 10 by design, only the
  // typeface follows Preferences.
  const { family } = useTypography();
  // Series colors frozen; grid/axis neutrals follow theme.
  const chartColors = useChartColors();
  const colors = useAppColors();

  const isEmpty = points.length < 2;

  const data = useMemo(
    () => {
      if (!isEmpty) {
        return points.map((point) => ({
          value: clampPercent(point.value),
          label: point.label ?? "",
        }));
      }

      return [
        { value: 0, label: "" },
        { value: 0, label: "" },
      ];
    },
    [points, isEmpty],
  );

  return (
    <View
      style={
        styles.container
      }
    >
      {/* Read-only chart: hideDataPoints + no press handlers.
          On web, block the chart's internal pan responder from
          claiming touches (orphan touchend -> "Cannot record
          touch end without a touch start"). Parent ScrollView
          still scrolls; native touch stays enabled. */}
      <View
        pointerEvents={
          Platform.OS === "web" ? "none" : "auto"
        }
      >
      <LineChart
        data={data}
        height={CHART_HEIGHT}
        width={Math.max(
          280,
          data.length * pointWidth,
        )}
        curved
        areaChart
        color={chartColors.green}
        thickness={2.5}
        startFillColor={
          chartColors.green
        }
        endFillColor={
          chartColors.green
        }
        startOpacity={colors.isDark ? 0.22 : 0.32}
        endOpacity={0.02}
        maxValue={100}
        noOfSections={5}
        yAxisOffset={0}
        formatYLabel={(label) =>
          `${label}%`
        }
        hideDataPoints
        spacing={pointWidth}
        initialSpacing={8}
        endSpacing={8}
        rulesType="solid"
        rulesColor={
          chartColors.grid
        }
        rulesThickness={1}
        showVerticalLines={false}
        yAxisColor={
          chartColors.grid
        }
        xAxisColor={
          chartColors.grid
        }
        yAxisTextStyle={{
          fontSize: 12,
          fontFamily: family,
          color:
            chartColors.axisLabel,
        }}
        xAxisLabelTextStyle={{
          fontSize: 12,
          fontFamily: family,
          color:
            chartColors.axisLabel,
        }}
        showReferenceLine1
        referenceLine1Position={20}
        referenceLine1Config={{
          color: chartColors.red,
          thickness: 1.5,
          type: "dashed",
          dashWidth: 4,
          dashGap: 4,
          labelText: "20% floor",
          labelTextStyle: {
            fontSize: 10,
            fontFamily: family,
            color: chartColors.axisLabel,
          },
        }}
        showScrollIndicator={false}
        scrollToEnd
        scrollAnimation={false}
      />
      </View>

      {/* Legend: line style + text so meaning never depends
          on color alone (solid green = battery %, dashed red
          = 20% safety floor). */}
      <View
        style={styles.legend}
        accessibilityRole="text"
        accessibilityLabel="Legend: solid line battery percent, dashed line 20 percent safety floor"
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
            20% safety floor
          </AppText>
        </View>
      </View>
    </View>
  );
}

/* ============================================================
   STYLES
   ============================================================ */

const styles =
  StyleSheet.create({
    container: {
      width: "100%",
    },

    legend: {
      flexDirection: "row",
      flexWrap: "wrap",
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
