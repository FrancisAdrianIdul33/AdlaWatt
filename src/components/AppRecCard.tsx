import { Ionicons } from "@expo/vector-icons";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Animated,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import ApplianceModal from "@/components/forms/ApplianceModal";
import {
  useApplianceCardStyles,
} from "@/components/forms/applianceCard";
import AppText from "@/components/ui/AppText";

import { Colors } from "@/constants/colors";
import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";
import { Radius } from "@/constants/theme";
import { Control } from "@/constants/sizing";
import {
  SlidingToggle,
} from "@/components/ui/SlidingToggle";
import { supabase } from "@/lib/supabase";

import {
  type BatteryStateInput,
  recommendAppliance,
} from "@/services/recommendation";

type Status =
  | "advisable"
  | "care"
  | "notAdvisable";

type Appliance = {
  id: string;
  name: string;
  watts: string;
  status: Status;
};

type DecoratedAppliance = Appliance & {
  color: string;
};

// Badge fills track the active theme (primary teal and a
// softened error red in dark mode) so fills and ink keep
// passing contrast both directions. The "care" amber keeps
// frozen dark ink (readable on yellow in both themes).
const badgeMeta = (status: Status, colors: AppColors) => {
  if (
    status === "care"
  ) {

    return {
      color: colors.warning,
      icon: "warning-outline" as const,
      label: "Use with care",
    };
  }

  if (
    status === "notAdvisable"
  ) {

    return {
      color: colors.error,
      icon: "alert-circle-outline" as const,
      label: "Not advisable",
    };
  }

  return {
    color: colors.primary,
    icon: "checkmark-circle-outline" as const,
    label: "OK to use",
  };
};

const EMPTY_STATE_META: Record<
  Status,
  { title: string; description: string }
> = {
  advisable: {
    title: "No Advisable Appliances",
    description:
      "No selected appliances are currently advisable to use.",
  },
  care: {
    title: "No Appliances to Use With Care",
    description:
      "No selected appliances currently need caution.",
  },
  notAdvisable: {
    title: "No Not Advisable Appliances",
    description:
      "No selected appliances are currently not advisable to use.",
  },
};

const TOGGLE_META: {
  mode: Status;
  label: string;
  color: string;
  accessibilityLabel: string;
}[] = [
  {
    mode: "advisable",
    label: "Advisable",
    // Resolved to themed tokens at render time so the
    // active segment tracks dark mode.
    color: "themed-primary",
    accessibilityLabel:
      "Show advisable appliances",
  },
  {
    mode: "care",
    label: "Caution",
    color: "themed-warning",
    accessibilityLabel:
      "Show appliances to use with care",
  },
  {
    mode: "notAdvisable",
    label: "Not Advisable",
    color: "themed-error",
    accessibilityLabel:
      "Show not advisable appliances",
  },
];

const defaultImage = require(
  "@/assets/images/adlawatt-icon.png",
);

export default function AppRecCard({
  battery,
}: {
  battery?: BatteryStateInput;
}) {
  const [mode, setMode] =
    useState<Status>("advisable");

  const colors = useAppColors();

  const styles = useMemo(
    () => getStyles(colors),
    [colors],
  );

  const applianceCardStyles =
    useApplianceCardStyles();

  const [index, setIndex] = useState(0);

  const [appliances, setAppliances] =
    useState<Appliance[]>([]);

  const [hasSelectedAppliances, setHasSelectedAppliances] =
    useState(false);

  const [modalVisible, setModalVisible] =
    useState(false);

  const buttonScale =
    useRef(new Animated.Value(1)).current;

  // ============================================
  // DECORATE APPLIANCES WITH RECOMMENDATION STATUS
  //
  // When a live battery reading exists the engine
  // verdict decides the badge. Without one the legacy
  // wattage-only heuristic keeps the prior behavior.
  // ============================================

  const decoratedAppliances =
    useMemo((): DecoratedAppliance[] => {
      if (!battery) {
        return appliances.map((item) => {
          const values =
            String(item.watts)
              .match(/\d+/g)
              ?.map(Number) ?? [];

          const maxWatts = Math.max(
            ...values,
            0,
          );

          const status =
            maxWatts > 300
              ? "notAdvisable"
              : "advisable";

          return {
            ...item,
            status,
            color:
              badgeMeta(
                status,
                colors,
              ).color,
          };
        });
      }

      return appliances.map((item) => {
        const recommendation =
          recommendAppliance(
            battery,
            {
              id: item.id,
              name: item.name,
              wattage: item.watts,
            },
          );

        const status =
          recommendation.verdict ===
          "notRecommended"
            ? "notAdvisable"
            : recommendation.verdict ===
                "care"
              ? "care"
              : "advisable";

        return {
          ...item,
          status,
          color:
            badgeMeta(
              status,
              colors,
            ).color,
        };
      });
    }, [appliances, battery, colors]);

  // ============================================
  // FILTER APPLIANCES BY STATUS
  // ============================================

  const filteredAppliances = useMemo(
    () =>
      decoratedAppliances.filter(
        (item) =>
          item.status === mode,
      ),
    [decoratedAppliances, mode],
  );

  // ============================================
  // CAROUSEL ITEMS
  // ============================================

  const currentAppliances = useMemo(() => {
    if (filteredAppliances.length === 0) {
      return [];
    }

    const count = Math.min(
      2,
      filteredAppliances.length,
    );

    return Array.from(
      { length: count },
      (_, offset) =>
        filteredAppliances[
        (index + offset) %
        filteredAppliances.length
        ],
    );
  }, [filteredAppliances, index]);

  // ============================================
  // LOAD USER APPLIANCES
  // ============================================

  const loadAppliances = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setAppliances([]);
      setHasSelectedAppliances(false);
      return;
    }

    const { data, error } =
      await supabase
        .from("appliances")
        .select(
          "app_id, appliance_name, wattage, selection",
        )
        .eq("user_id", user.id)
        .order("appliance_name");

    if (error) {
      console.error(
        "Failed to load appliances:",
        error.message,
      );

      setAppliances([]);
      setHasSelectedAppliances(false);
      return;
    }

    const selectedRows =
      (data ?? []).filter(
        (item) => item.selection === true,
      );

    setHasSelectedAppliances(
      selectedRows.length > 0,
    );

    const mapped: Appliance[] =
      selectedRows.map((item) => ({
        id: item.app_id,
        name: item.appliance_name,
        watts: item.wattage,
        status: "advisable",
      }));

    setAppliances(mapped);
  };

  // ============================================
  // INITIAL LOAD
  // ============================================

  useEffect(() => {
    loadAppliances();
  }, []);

  // ============================================
  // RESET CAROUSEL
  // ============================================

  useEffect(() => {
    setIndex(0);
  }, [mode]);

  // ============================================
  // APPLIANCE CAROUSEL
  // ============================================

  useEffect(() => {
    if (filteredAppliances.length <= 1) {
      return;
    }

    const timer = setInterval(() => {
      setIndex(
        (currentIndex) =>
          currentIndex + 1,
      );
    }, 5000);

    return () =>
      clearInterval(timer);
  }, [filteredAppliances.length]);

  // ============================================
  // OPEN / CLOSE APPLIANCE MODAL
  // ============================================

  const openApplianceModal = () => {
    setModalVisible(true);
  };

  const closeApplianceModal = () => {
    setModalVisible(false);
    loadAppliances();
  };

  // ============================================
  // GET STARTED BUTTON ANIMATION
  // ============================================

  const animateButton = (
    scale: number,
  ) => {
    Animated.spring(buttonScale, {
      toValue: scale,
      useNativeDriver: Platform.OS !== "web",
      speed: 20,
      bounciness: 6,
    }).start();
  };

  // ============================================
  // MODE 1: NO SELECTED APPLIANCES
  // ============================================

  if (!hasSelectedAppliances) {
    return (
      <>
        <View style={styles.recCard}>
          <RecHeader
            styles={styles}
            colors={colors}
          />

          <View style={styles.recBody}>
            <View style={styles.recContent}>
            <View style={styles.getStartedContent}>
              <AppText
                variant="body"
                style={styles.getStartedTitle}
              >
                Welcome to AdlaWatt, Get started!
              </AppText>

              <Pressable
                onPress={openApplianceModal}
                onPressIn={() =>
                  animateButton(0.95)
                }
                onPressOut={() =>
                  animateButton(1)
                }
                accessibilityRole="button"
                accessibilityLabel="Add Appliances"
              >
                <Animated.View
                  style={[
                    styles.addAppliancesButton,
                    {
                      transform: [
                        {
                          scale: buttonScale,
                        },
                      ],
                    },
                  ]}
                >
                  <Ionicons
                    name="add"
                    size={21}
                    color={colors.onPrimary}
                  />

                  <AppText
                    variant="caption"
                    style={
                      styles.addAppliancesButtonText
                    }
                  >
                    Add Appliances
                  </AppText>
                </Animated.View>
              </Pressable>
            </View>
            </View>
          </View>
        </View>

        <ApplianceModal
          visible={modalVisible}
          onClose={closeApplianceModal}
        />
      </>
    );
  }

  // ============================================
  // MODE 2: SELECTED APPLIANCES EXIST
  // ============================================

  return (
    <>
      <View style={styles.recCard}>
        <RecHeader
          styles={styles}
          colors={colors}
        />

        <View style={styles.recBody}>
          {/* Status Toggle (top — this card's signature order) */}
          <SlidingToggle<Status>
            value={mode}
            onChange={setMode}
            style={styles.toggleColors}
            options={TOGGLE_META.map(
              ({
                mode: segmentMode,
                label,
                color,
                accessibilityLabel,
              }) => ({
                value: segmentMode,
                label,
                activeColor:
                  color === "themed-primary"
                    ? colors.primary
                    : color === "themed-warning"
                      ? colors.warning
                      : colors.error,
                activeInk:
                  segmentMode === "care"
                    ? Colors.light.text
                    : undefined,
                accessibilityLabel,
              }),
            )}
          />

          {/* Appliances / Empty Text */}
          {filteredAppliances.length > 0 ? (
          <View style={styles.recContent}>
            <View style={styles.applianceRow}>
              {currentAppliances.map(
                (appliance) => {
                  const meta =
                    badgeMeta(
                      appliance.status,
                      colors,
                    );

                  return (
                  <View
                    key={appliance.id}
                    style={[
                      applianceCardStyles.box,
                      {
                        borderColor:
                          meta.color,
                      },
                    ]}
                  >
                    {/* Fixed Image Area */}
                    <View
                      style={[
                        applianceCardStyles.imageContainer,
                        {
                          borderColor:
                            meta.color,
                        },
                      ]}
                    >
                      <Image
                        source={defaultImage}
                        style={
                          applianceCardStyles.image
                        }
                        resizeMode="cover"
                      />
                    </View>

                    {/* Bounded Appliance Name */}
                    <AppText
                      variant="caption"
                      style={
                        applianceCardStyles.name
                      }
                      numberOfLines={2}
                    >
                      {appliance.name}
                    </AppText>

                    {/* Wattage */}
                    <AppText
                      variant="caption"
                      style={
                        applianceCardStyles.watts
                      }
                      numberOfLines={1}
                    >
                      {appliance.watts}
                    </AppText>

                    {/* Status */}
                    <View
                      style={[
                        applianceCardStyles.status,
                        {
                          backgroundColor:
                            meta.color,
                        },
                      ]}
                    >
                      <Ionicons
                        name={meta.icon}
                        size={13}
                  color={colors.onPrimary}
                      />

                      <AppText
                        variant="caption"
                        style={
                          applianceCardStyles.statusText
                        }
                        numberOfLines={1}
                      >
                        {meta.label}
                      </AppText>
                    </View>
                  </View>
                  );
                },
              )}
            </View>

            {/* Carousel Indicator */}
            <View style={styles.indicator}>
              {Array.from({
                length: Math.min(
                  10,
                  Math.ceil(filteredAppliances.length / 2),
                ),
              }).map((_, itemIndex) => {
                const indicatorCount = Math.min(
                  10,
                  Math.ceil(filteredAppliances.length / 2),
                );

                const activeIndicator =
                  Math.floor(index / 2) % indicatorCount;

                return (
                  <View
                    key={itemIndex}
                    style={[
                      styles.dot,
                      {
                        backgroundColor:
                          itemIndex === activeIndicator
                            ? currentAppliances[0]
                                .color
                            : colors.border,
                      },
                    ]}
                  />
                );
              })}
            </View>
          </View>
        ) : (
          <View style={styles.recContent}>
          <View style={styles.emptyContent}>
            <Ionicons
              name="hardware-chip-outline"
              size={48}
              color={colors.textSecondary}
            />

            <AppText
              variant="body"
              style={styles.emptyTitle}
            >
              {
                EMPTY_STATE_META[mode]
                  .title
              }
            </AppText>

            <AppText
              variant="caption"
              style={styles.emptyText}
            >
              {
                EMPTY_STATE_META[mode]
                  .description
              }
            </AppText>
          </View>
          </View>
        )}
        </View>
      </View>

      <ApplianceModal
        visible={modalVisible}
        onClose={closeApplianceModal}
      />
    </>
  );
}

function RecHeader({
  styles,
  colors,
}: {
  styles: ReturnType<typeof getStyles>;
  colors: AppColors;
}) {
  return (
    <View style={styles.recHeaderPanel}>
      <View style={styles.recHeaderLeft}>
        <Ionicons
          name="medal-outline"
          size={26}
          color={colors.headerContent}
        />

        <AppText
          variant="heading"
          style={styles.recHeaderTitle}
        >
          Appliance Recommendation
        </AppText>
      </View>
    </View>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
  // ============================================
  // CARD SHELL + HEADER
  //
  // Same language as the monitoring cards: bordered shell
  // with edge-to-edge header bar, then a padded body.
  // Signature order inside: toggle, content, dots.
  // ============================================

  recCard: {
    width: "100%",
    backgroundColor:
      colors.glass.white,
    borderWidth: 3,
    borderColor:
      colors.cardBorder,
    borderRadius: 15,
    flexDirection: "column",
    alignItems: "stretch",
    overflow: "hidden",
  },

  recHeaderPanel: {
    width: "100%",
    backgroundColor:
      colors.headerBackground,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 9,
  },

  recHeaderLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },

  recHeaderTitle: {
    color: colors.headerContent,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
    flexShrink: 1,
  },

  recBody: {
    width: "100%",
    padding: 16,
    paddingBottom: 8,
    gap: 16,
  },

  // Fixed content slot = carousel height (240 row + 8 gap +
  // 24 dots). Empty and get-started center in the same slot
  // so the card never changes height between states.
  recContent: {
    width: "100%",
    height: 272,
  },

  // Fixed content slot = carousel height (240 row + 8 gap +
  // 33 dots). Empty and get-started center in the same slot
  // so the card never jumps between states and the dots sit
  // tight between the boxes and the card bottom.
  recSlot: {
    width: "100%",
    height: 281,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  // ============================================
  // APPLIANCE CAROUSEL / EMPTY STATE SLOT
  // ============================================

  applianceRow: {
    width: "100%",
    height: 240,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
    gap: 12,
  },

  // ============================================
  // CAROUSEL INDICATOR
  //
  // Always remains directly below top content.
  // ============================================

  indicator: {
    width: "100%",
    height: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 8,
  },

  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  // ============================================
  // STATUS TOGGLE
  // ============================================

  toggleColors: {
    width: "100%",
    maxWidth: 360,
    alignSelf: "center",
    backgroundColor: colors.glass.white,
    borderColor: colors.border,
    borderRadius: Radius.md,
  },

  // ============================================
  // EMPTY TEXT (no box — lives on the card body)
  // ============================================

  emptyContent: {
    width: "100%",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  emptyTitle: {
    color: colors.text,
    fontWeight: "700",
    textAlign: "center",
  },

  emptyText: {
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },

  // ============================================
  // MODE 1 - GET STARTED (inside the card)
  // ============================================

  getStartedContent: {
    width: "100%",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  getStartedTitle: {
    color: colors.text,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
  },

  addAppliancesButton: {
    minHeight: Control.button,
    width: "100%",
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: Radius.md,
  },

  addAppliancesButtonText: {
    color: colors.onPrimary,
    fontWeight: "700",
  },

  // ============================================
  // PRESS FEEDBACK
  // ============================================

  pressed: {
    opacity: 0.7,
  },
});