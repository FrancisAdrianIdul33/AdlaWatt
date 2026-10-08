import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import AnalyticsChartCard from "@/components/AnalyticsChartCard";
import AppText from "@/components/ui/AppText";
import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";

/* ============================================================
   MANUAL SECTION CARD
   Thin wrapper over AnalyticsChartCard so manual sections are
   visually indistinguishable from Analytics cards (same shell,
   header panel, subtitle, spacing) in both themes.

   Title format: "N · Section name". Subsections and Q&As that
   expand inline render as ManualSubRow below the intro body.
   ============================================================ */

interface ManualSectionCardProps {
  number: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  subtitle: string;
  children: React.ReactNode;
}

export default function ManualSectionCard({
  number,
  title,
  icon,
  subtitle,
  children,
}: ManualSectionCardProps) {
  return (
    <AnalyticsChartCard
      title={`${number} · ${title}`}
      subtitle={subtitle}
      icon={icon}
    >
      {children}
    </AnalyticsChartCard>
  );
}

/* ============================================================
   MANUAL SUB ROW
   Expandable row for §7 subsections and §13 Q&As. Tapping the
   row toggles the body below it.
   ============================================================ */

interface ManualSubRowProps {
  label: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export function ManualSubRow({
  label,
  expanded,
  onToggle,
  children,
}: ManualSubRowProps) {
  const colors = useAppColors();

  const styles = React.useMemo(
    () => getSubRowStyles(colors),
    [colors],
  );

  return (
    <View style={styles.wrap}>
      <Pressable
        style={({ pressed }) => [
          styles.row,
          pressed && styles.pressed,
        ]}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{
          expanded,
        }}
        accessibilityLabel={label}
      >
        <AppText
          variant="body"
          style={styles.label}
        >
          {label}
        </AppText>

        <Ionicons
          name={
            expanded
              ? "chevron-down"
              : "chevron-forward"
          }
          size={18}
          color={colors.textSecondary}
        />
      </Pressable>

      {expanded ? (
        <View style={styles.body}>
          {children}
        </View>
      ) : null}
    </View>
  );
}

const getSubRowStyles = (
  colors: AppColors,
) =>
  StyleSheet.create({
    wrap: {
      width: "100%",
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: 8,
    },

    row: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      paddingVertical: 10,
      gap: 8,
    },

    pressed: {
      opacity: 0.6,
    },

    label: {
      flex: 1,
      color: colors.text,
      fontWeight: "600",
      fontSize: 14,
    },

    body: {
      width: "100%",
      paddingBottom: 10,
    },
  });
