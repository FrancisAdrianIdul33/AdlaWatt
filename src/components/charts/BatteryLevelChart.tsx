import {
  useMemo,
} from "react";
import {
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
   even without enough history.
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
        startOpacity={0.32}
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
        }}
        showScrollIndicator={false}
        scrollToEnd
        scrollAnimation={false}
      />
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
  });
