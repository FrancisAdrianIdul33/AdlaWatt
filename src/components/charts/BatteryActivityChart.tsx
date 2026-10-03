import {
  useMemo,
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
  BatteryActivityKey,
  BatteryActivitySlice,
} from "@/services/analyticsService";

/* ============================================================
   CONSTANTS
   ============================================================ */

const DONUT_RADIUS = 85;
const DONUT_INNER_RADIUS = 55;

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

function BreakdownRow({
  swatchColor,
  label,
  detail,
  percent,
  trackColor,
}: {
  swatchColor: string;
  label: string;
  detail: string;
  percent: number;
  trackColor: string;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <View
          style={[
            styles.rowSwatch,
            { backgroundColor: swatchColor },
          ]}
        />

        <AppText
          variant="caption"
          style={styles.rowLabel}
        >
          {label}
        </AppText>

        <AppText
          variant="caption"
          style={styles.rowDetail}
        >
          {detail}
        </AppText>
      </View>

      <View
        style={[
          styles.track,
          { backgroundColor: trackColor },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              width: `${Math.max(
                0,
                Math.min(100, percent),
              )}%`,
              backgroundColor: swatchColor,
            },
          ]}
        />
      </View>
    </View>
  );
}

/* ============================================================
   BATTERY ACTIVITY DONUT
   Charging = green, Discharging = yellow, Idle = gray muted.
   No blue anywhere: every slice sets an explicit color.
   Text + percent + count carry meaning so color is never
   the only indicator (green/yellow is deuteranopia-risky).
   Yellow slice never hosts white text (dark ink only).
   ============================================================ */

const SLICE_ORDER: BatteryActivityKey[] =
  [
    "charging",
    "discharging",
    "idle",
  ];

export default function BatteryActivityChart({
  slices,
}: {
  slices: BatteryActivitySlice[];
}) {
  const { family } = useTypography();
  const chartColors = useChartColors();
  const colors = useAppColors();

  const byKey = useMemo(() => {
    const map = new Map<
      BatteryActivityKey,
      BatteryActivitySlice
    >();

    slices.forEach((slice) => {
      map.set(slice.key, slice);
    });

    return map;
  }, [slices]);

  const ordered = useMemo(
    () =>
      SLICE_ORDER.map(
        (key) =>
          byKey.get(key) ?? {
            key,
            label:
              key === "charging"
                ? "Charging"
                : key === "discharging"
                  ? "Discharging"
                  : "Idle",
            value: 0,
            percent: 0,
          },
      ),
    [byKey],
  );

  const total = useMemo(
    () =>
      ordered.reduce(
        (sum, slice) => sum + slice.value,
        0,
      ),
    [ordered],
  );

  const isEmpty = total <= 0;

  // Explicit frozen mapping: green / yellow / gray. No blue.
  const sliceColors = useMemo(
    () => ({
      charging: chartColors.green,
      discharging: chartColors.yellow,
      idle: chartColors.muted,
    }),
    [chartColors],
  );

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
      .filter(
        (slice) => slice.value > 0,
      )
      .map((slice) => ({
        value: slice.value,
        color: sliceColors[slice.key],
      }));
  }, [
    ordered,
    isEmpty,
    sliceColors,
    chartColors,
  ]);

  const charging = ordered[0];
  const discharging = ordered[1];

  return (
    <View style={styles.container}>
      {/* Stats: text labels, not color only. */}
      <View style={styles.statsRow}>
        <Stat
          label="Total"
          value={
            isEmpty ? "-" : `${total}`
          }
          color={colors.text}
        />

        <Stat
          label="Charging"
          value={
            isEmpty
              ? "-"
              : `${charging.percent}%`
          }
          color={colors.text}
        />

        <Stat
          label="Discharging"
          value={
            isEmpty
              ? "-"
              : `${discharging.percent}%`
          }
          color={colors.text}
        />
      </View>

      {/* Donut: center shows total, slices carry no inner text
          so yellow never hosts unreadable white labels. */}
      <View style={styles.donutWrap}>
        <PieChart
          data={pieData}
          donut
          radius={DONUT_RADIUS}
          innerRadius={DONUT_INNER_RADIUS}
          strokeWidth={2}
          strokeColor={colors.background}
          showText={false}
          focusOnPress={!isEmpty}
          sectionAutoFocus={!isEmpty}
          centerLabelComponent={() => (
            <View
              style={styles.centerLabel}
            >
              <AppText
                variant="heading"
                style={[
                  styles.centerValue,
                  { color: colors.text },
                ]}
              >
                {isEmpty
                  ? "-"
                  : `${total}`}
              </AppText>

              <AppText
                variant="caption"
                style={styles.centerCaption}
              >
                samples
              </AppText>
            </View>
          )}
        />
      </View>

      {isEmpty ? (
        <AppText
          variant="caption"
          style={styles.emptyNote}
        >
          No samples in this range —
          connect the device to record
          battery status.
        </AppText>
      ) : (
        <View style={styles.breakdown}>
          {ordered.map((slice) => (
            <BreakdownRow
              key={slice.key}
              swatchColor={
                sliceColors[slice.key]
              }
              label={slice.label}
              detail={`${slice.value} • ${slice.percent}%`}
              percent={slice.percent}
              trackColor={colors.scrimFaint}
            />
          ))}
        </View>
      )}

      {/* Legend: color + text so meaning never depends
          on color alone. Font family follows Preferences. */}
      <View
        style={styles.legend}
        accessibilityRole="text"
        accessibilityLabel="Legend: green charging, yellow discharging, gray idle"
      >
        {ordered.map((slice) => (
          <View
            key={slice.key}
            style={styles.legendItem}
          >
            <View
              style={[
                styles.legendSwatch,
                {
                  backgroundColor:
                    sliceColors[
                      slice.key
                    ],
                },
              ]}
            />

            <AppText
              variant="caption"
              style={[
                styles.legendText,
                { fontFamily: family },
              ]}
            >
              {slice.label}
            </AppText>
          </View>
        ))}
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

  breakdown: {
    width: "100%",
    gap: 10,
    marginTop: 12,
  },

  row: {
    width: "100%",
    gap: 6,
  },

  rowHeader: {
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

  track: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },

  fill: {
    height: 8,
    borderRadius: 4,
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
    marginTop: 12,
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
