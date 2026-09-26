import React, { useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppText from "@/components/ui/AppText";
import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";
import {
  ChartFrequency,
  FREQUENCIES,
} from "@/services/analyticsService";

/* ============================================================
   PROPS
   ============================================================ */

export interface AnalyticsChartCardProps {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  frequency: ChartFrequency;
  onFrequencyChange: (
    frequency: ChartFrequency,
  ) => void;
  children: React.ReactNode;
}

/* ============================================================
   CARD
   ============================================================ */

export default function AnalyticsChartCard({
  title,
  subtitle,
  icon,
  frequency,
  onFrequencyChange,
  children,
}: AnalyticsChartCardProps) {
  const colors = useAppColors();

  const styles = useMemo(
    () => getStyles(colors),
    [colors],
  );

  return (
    <View
      style={
        styles.card
      }
    >
      {/* Header / Accent Panel */}
      <View
        style={
          styles.headerPanel
        }
      >
        <Ionicons
          name={icon}
          size={26}
          color={colors.iconAccent}
        />

        <AppText
          variant="heading"
          style={
            styles.headerTitle
          }
        >
          {title}
        </AppText>
      </View>

      {/* Body */}
      <View
        style={
          styles.body
        }
      >
        <AppText
          variant="caption"
          style={
            styles.subtitle
          }
        >
          {subtitle}
        </AppText>

        {/* Frequency */}
        <View
          style={
            styles.frequencyToggle
          }
        >
          {FREQUENCIES.map(
            (option) => {
              const active =
                frequency ===
                option;

              return (
                <Pressable
                  key={option}
                  onPress={() =>
                    onFrequencyChange(
                      option,
                    )
                  }
                  accessibilityRole="button"
                  accessibilityLabel={
                    `${title} ${option} view`
                  }
                  accessibilityState={{
                    selected: active,
                  }}
                  style={({ pressed }) => [
                    styles.frequencyButton,
                    active &&
                      styles.frequencyButtonActive,
                    pressed &&
                      styles.pressed,
                  ]}
                >
                  <AppText
                    variant="caption"
                    style={[
                      styles.frequencyText,
                      active &&
                        styles.frequencyTextActive,
                    ]}
                  >
                    {option}
                  </AppText>
                </Pressable>
              );
            },
          )}
        </View>

        {/* Chart Area */}
        <View
          style={
            styles.chartArea
          }
        >
          {children}
        </View>
      </View>
    </View>
  );
}

/* ============================================================
   STYLES
   ============================================================ */

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    card: {
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
      marginBottom: 18,
    },

    headerPanel: {
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

    headerTitle: {
      color: colors.onPrimary,
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 8,
      flexShrink: 1,
    },

    body: {
      padding: 16,
    },

    subtitle: {
      color:
        colors.textSecondary,
      lineHeight: 19,
      marginBottom: 12,
    },

    frequencyToggle: {
      width: "100%",
      height: 46,
      flexDirection: "row",
      backgroundColor:
        colors.scrimFaint,
      borderWidth: 2,
      borderColor:
        colors.border,
      borderRadius: 12,
      padding: 3,
      marginBottom: 14,
    },

    frequencyButton: {
      flex: 1,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 9,
    },

    frequencyButtonActive: {
      backgroundColor:
        colors.primary,
    },

    frequencyText: {
      color: colors.text,
      fontSize: 12,
      fontWeight: "700",
    },

    frequencyTextActive: {
      color: colors.onPrimary,
    },

    chartArea: {
      width: "100%",
      alignItems: "stretch",
    },

    pressed: {
      opacity: 0.7,
    },
  });