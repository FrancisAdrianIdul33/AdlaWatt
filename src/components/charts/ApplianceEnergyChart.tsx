import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  StyleSheet,
  View,
} from "react-native";
import {
  PieChart,
} from "react-native-gifted-charts";
import {
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

const DONUT_RADIUS = 85;
const DONUT_INNER_RADIUS = 55;
const SELECTION_RESET_MS = 5000;
const FOCUS_EXPAND_RADIUS = 8;

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

// Compact watt-hours: 2100 -> "2.1kWh", 800 -> "800Wh".
function formatWh(value: number): string {
  if (value >= 1000) {
    const kwh =
      Math.round((value / 1000) * 10) / 10;

    return `${kwh}kWh`;
  }

  return `${Math.round(value)}Wh`;
}

/* ============================================================
   ENERGY BY APPLIANCE DONUT
   Top 5 appliances plus an Other aggregate (see
   getApplianceEnergyShare). Rank colors in order: green,
   yellow, orange, red, then muted for 5th and Other — text
   (% + Wh in the legend rows and stats) carries those two,
   since only four series tokens exist. No blue anywhere.
   Same tap-to-reveal interaction as Battery Activity: tapping a
   slice swaps its energy into the center for 5s, then the view
   auto-reverts and the slice closes. Focus is driven live via
   focusedPieIndex on a stable key (never remount per tap) because
   datum onPress skips the library's internal focus.
   Empty until the app records appliance usage: gray placeholder
   plus a note naming the cause, never placeholder data.
   ============================================================ */

export default function ApplianceEnergyChart({
  slices,
}: {
  slices: ApplianceShareSlice[];
}) {
  const { family } = useTypography();
  const chartColors = useChartColors();
  const colors = useAppColors();

  const total = useMemo(
    () =>
      slices.reduce(
        (sum, slice) => sum + Math.max(0, slice.energyWh),
        0,
      ),
    [slices],
  );
  const isEmpty = total <= 0;

  const ordered = useMemo(
    () =>
      slices.map((slice) => ({
        name: slice.name,
        energyWh: Math.max(0, slice.energyWh),
        percent:
          total > 0
            ? Math.round(
                (Math.max(0, slice.energyWh) / total) * 100,
              )
            : 0,
      })),
    [slices, total],
  );

  // Rank palette: series tokens in order, muted for 5th + Other.
  const rankColors = useMemo(
    () => [
      chartColors.green,
      chartColors.yellow,
      chartColors.orange,
      chartColors.red,
      chartColors.muted,
      chartColors.muted,
    ],
    [chartColors],
  );

  // Tap-to-reveal: center swaps total -> tapped slice energy,
  // then auto-reverts after 5s. Rapid taps restart the clock.
  // Expand is driven through live focusedPieIndex (the library
  // reacts to it in place), so slice switches never tear down
  // the chart.
  const [
    selectedIndex,
    setSelectedIndex,
  ] = useState<number | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearResetTimer = () => {
    if (resetTimer.current != null) {
      clearTimeout(resetTimer.current);
      resetTimer.current = null;
    }
  };

  const handleSlicePress = useCallback(
    (index: number) => {
      if (isEmpty) {
        return;
      }

      clearResetTimer();
      setSelectedIndex(index);
      resetTimer.current = setTimeout(() => {
        setSelectedIndex(null);
        resetTimer.current = null;
      }, SELECTION_RESET_MS);
    },
    [isEmpty],
  );

  useEffect(() => {
    setSelectedIndex(null);
    clearResetTimer();

    return clearResetTimer;
  }, [slices, isEmpty]);

  // Donut hole: solid disc in both themes (never removed).
  // Light keeps the library's default white. Dark uses #252525,
  // the opaque composite of glassDark.white (8% white) over
  // background #121212, so the disc matches the card exactly.
  const holeColor = colors.isDark ? "#252525" : "white";

  const selectedSlice =
    selectedIndex != null
      ? (ordered[selectedIndex] ?? null)
      : null;
  const selectedVisible =
    selectedSlice != null &&
    selectedSlice.energyWh > 0 &&
    !isEmpty;

  const pieData = useMemo(() => {
    if (isEmpty) {
      return [
        {
          value: 1,
          color: chartColors.muted,
        },
      ];
    }

    return ordered
      .map((slice, index) => ({
        value: slice.energyWh,
        color: rankColors[index] ?? chartColors.muted,
        onPress: () => handleSlicePress(index),
      }))
      .filter((entry) => entry.value > 0);
  }, [
    ordered,
    isEmpty,
    rankColors,
    chartColors,
    handleSlicePress,
  ]);

  // Focused index must track the FILTERED data array (zero-energy
  // slices are untappable and unrendered).
  const focusedDataIndex = useMemo(() => {
    if (selectedIndex == null || isEmpty) {
      return null;
    }

    const name = ordered[selectedIndex]?.name;

    const dataIndex = ordered
      .filter((slice) => slice.energyWh > 0)
      .findIndex((slice) => slice.name === name);

    return dataIndex >= 0 ? dataIndex : null;
  }, [ordered, selectedIndex, isEmpty]);

  const top = ordered[0] ?? null;

  return (
    <View style={styles.container}>
      {/* Stats: ranking + coverage live here only. Wh totals
          live in the center and rows — never repeated. */}
      <View style={styles.statsRow}>
        <Stat
          label="Top"
          value={
            top != null && !isEmpty
              ? `${top.name} ${top.percent}%`
              : "-"
          }
          color={colors.text}
        />

        <Stat
          label="Tracked"
          value={isEmpty ? "-" : `${ordered.length}`}
          color={colors.text}
        />
      </View>

      {/* Donut: center shows total, or the tapped slice energy
          for 5s. Slices carry no inner text. */}
      <View style={styles.donutWrap}>
        <PieChart
          // Stable across taps: focus is driven live via
          // focusedPieIndex, so slice-to-slice switches never
          // tear down the chart. Remounts only when data changes.
          key={`appliance-energy-${pieData.length}`}
          data={pieData}
          donut
          radius={DONUT_RADIUS}
          innerRadius={DONUT_INNER_RADIUS}
          strokeWidth={2}
          strokeColor={colors.background}
          backgroundColor="transparent"
          innerCircleColor={holeColor}
          showText={false}
          focusOnPress={!isEmpty}
          sectionAutoFocus={!isEmpty}
          focusedPieIndex={focusedDataIndex ?? -1}
          extraRadius={FOCUS_EXPAND_RADIUS}
          isAnimated
          centerLabelComponent={() => (
            <View
              style={styles.centerLabel}
              pointerEvents="none"
            >
              {selectedVisible ? (
                <AppText
                  variant="caption"
                  style={[
                    styles.centerCaption,
                    { color: colors.text },
                  ]}
                >
                  {selectedSlice!.name}
                </AppText>
              ) : null}

              <AppText
                variant="heading"
                style={[
                  styles.centerValue,
                  { color: colors.text },
                ]}
              >
                {isEmpty
                  ? "-"
                  : selectedVisible
                    ? formatWh(selectedSlice!.energyWh)
                    : formatWh(total)}
              </AppText>

              <AppText
                variant="caption"
                style={[
                  styles.centerCaption,
                  { color: colors.text },
                ]}
              >
                {selectedVisible ? "used" : "total"}
              </AppText>
            </View>
          )}
        />
      </View>

      {/* Fixed hint slot: always mounted so the legend never
          shifts when the hint appears. Fades via opacity. */}
      {!isEmpty ? (
        <AppText
          variant="caption"
          style={[
            styles.emptyNote,
            { opacity: selectedVisible ? 1 : 0 },
          ]}
          accessibilityElementsHidden={
            !selectedVisible
          }
          importantForAccessibility={
            selectedVisible
              ? "yes"
              : "no-hide-descendants"
          }
        >
          Tap another slice to inspect it
        </AppText>
      ) : null}

      {isEmpty ? (
        <AppText
          variant="caption"
          style={styles.emptyNote}
        >
          No appliance records yet —
          usage logging will fill this card.
        </AppText>
      ) : null}

      {/* Slice rows double as the legend (swatch + name), so no
          separate legend block: with dynamic slices it would only
          repeat names. Each row carries that slice's Wh + %. */}
      {!isEmpty ? (
        <View style={styles.breakdown}>
          {ordered.map((slice, index) => (
            <View
              key={slice.name}
              style={styles.row}
            >
              <View
                style={[
                  styles.rowSwatch,
                  {
                    backgroundColor:
                      rankColors[index] ?? chartColors.muted,
                  },
                ]}
              />

              <AppText
                variant="caption"
                style={[
                  styles.rowLabel,
                  { fontFamily: family },
                ]}
              >
                {slice.name}
              </AppText>

              <AppText
                variant="caption"
                style={styles.rowDetail}
              >
                {`${formatWh(slice.energyWh)} • ${slice.percent}%`}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}
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

  donutWrap: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },

  centerLabel: {
    alignItems: "center",
    justifyContent: "center",
  },

  centerValue: {
    fontSize: 22,
    fontVariant: ["tabular-nums"],
  },

  centerCaption: {
    fontSize: 11,
  },

  emptyNote: {
    marginTop: 8,
    textAlign: "center",
  },

  breakdown: {
    width: "100%",
    gap: 8,
    marginTop: 12,
  },

  row: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  rowSwatch: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },

  rowLabel: {
    fontSize: 12,
    flex: 1,
  },

  rowDetail: {
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
});
