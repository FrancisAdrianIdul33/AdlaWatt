import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";

import AppText from "@/components/ui/AppText";
import { useAppColors } from "@/hooks/useAppColors";
import { segmentedSizes } from "@/components/ui/segmented";

// ============================================================
// SLIDING TOGGLE
//
// Shared N-segment control with a single gliding pill (the
// Bootstrap two-word-switch pattern ported to React Native).
// The pill width derives from the measured shell width so it
// stays exact on any screen size; segments keep transparent
// 48px targets with the active fill living only on the pill.
//
// Motion: 220ms native-driven glide; snaps instantly when
// the OS requests reduced motion. Colors resolve per theme.
// ============================================================

export interface SlidingOption<T extends string> {
  value: T;
  label: string;
  /** Pill fill when selected. */
  activeColor: string;
  /** Label ink on the pill (defaults to onPrimary). */
  activeInk?: string;
  accessibilityLabel: string;
}

interface SlidingToggleProps<T extends string> {
  options: readonly SlidingOption<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: ViewStyle;
  /**
   * Pill corner radius. Match it to the shell container's
   * radius so the box echoes the toggle shape.
   * Defaults to 8 (nests inside 12-14 shells).
   */
  pillRadius?: number;
}

const GLIDE_MS = 220;

export function SlidingToggle<T extends string>({
  options,
  value,
  onChange,
  style,
  pillRadius = 8,
}: SlidingToggleProps<T>) {
  const colors = useAppColors();

  const styles = useMemo(
    () => getStyles(),
    [],
  );

  const [width, setWidth] = useState(0);
  const [reduceMotion, setReduceMotion] =
    useState(false);

  const glide = useRef(
    new Animated.Value(0),
  ).current;

  const activeIndex = Math.max(
    0,
    options.findIndex(
      (option) => option.value === value,
    ),
  );

  const pad = 3;
  const inset = 4;
  const segmentWidth =
    width > 0
      ? (width - pad * 2) / options.length
      : 0;
  // Pill sits slightly small inside its segment so it
  // floats with distance from the shell on all sides.
  const pillWidth = Math.max(
    0,
    segmentWidth - inset * 2,
  );

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => {});
  }, []);

  useEffect(() => {
    Animated.timing(glide, {
      toValue: activeIndex,
      duration: reduceMotion ? 0 : GLIDE_MS,
      useNativeDriver: true,
    }).start();
  }, [activeIndex, glide, reduceMotion]);

  const active = options[activeIndex];

  return (
    <View
      style={[
        segmentedSizes.shell,
        style,
      ]}
      onLayout={(event) =>
        setWidth(
          event.nativeEvent.layout.width,
        )
      }
      accessibilityRole="radiogroup"
    >
      {width > 0 && (
        <Animated.View
          style={[
            styles.pill,
            {
              width: pillWidth,
              marginLeft: inset,
              borderRadius: pillRadius,
              backgroundColor:
                active.activeColor,
              transform: [
                {
                  translateX: glide.interpolate(
                    {
                      inputRange: options.map(
                        (_, position) =>
                          position,
                      ),
                      outputRange:
                        options.map(
                          (_, position) =>
                            position *
                            segmentWidth,
                        ),
                    },
                  ),
                },
              ],
            },
          ]}
        />
      )}

      {options.map((option) => {
        const selected =
          option.value === value;

        return (
          <Pressable
            key={option.value}
            onPress={() =>
              onChange(option.value)
            }
            accessibilityRole="radio"
            accessibilityState={{
              selected,
            }}
            accessibilityLabel={
              option.accessibilityLabel
            }
            style={({ pressed }) => [
              segmentedSizes.segment,
              pressed && styles.pressed,
            ]}
          >
            <AppText
              variant="caption"
              style={[
                segmentedSizes.label,
                {
                  color: selected
                    ? (option.activeInk ??
                      colors.onPrimary)
                    : colors.text,
                },
              ]}
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const getStyles = () =>
  StyleSheet.create({
    pill: {
      position: "absolute",
      top: 6,
      bottom: 6,
      left: 3,
      elevation: 2,
    },

    pressed: {
      opacity: 0.7,
    },
  });
