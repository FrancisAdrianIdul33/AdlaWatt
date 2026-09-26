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
import EmptyState from "@/components/ui/EmptyState";

import { Colors } from "@/constants/colors";
import { Radius } from "@/constants/theme";
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

const badgeMeta = (status: Status) => {
  if (
    status === "care"
  ) {

    return {
      color: Colors.light.warning,
      icon: "warning-outline" as const,
      label: "Use with care",
    };
  }

  if (
    status === "notAdvisable"
  ) {

    return {
      color: Colors.light.error,
      icon: "alert-circle-outline" as const,
      label: "Not advisable",
    };
  }

  return {
    color: Colors.light.primary,
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
    color: Colors.light.primary,
    accessibilityLabel:
      "Show advisable appliances",
  },
  {
    mode: "care",
    label: "Caution",
    color: Colors.light.warning,
    accessibilityLabel:
      "Show appliances to use with care",
  },
  {
    mode: "notAdvisable",
    label: "Not Advisable",
    color: Colors.light.error,
    accessibilityLabel:
      "Show not advisable appliances",
  },
];

const defaultImage = require(
  "@/assets/images/adlawatt-icon.png",
);

const tips = [
  "Use lower-wattage appliances first to extend the available battery energy.",
  "Avoid using several high-power appliances at the same time.",
  "Turn off appliances when they are not needed to conserve stored energy.",
  "Prioritize essential appliances during a power interruption.",
];



export default function AppRecCard({
  battery,
}: {
  battery?: BatteryStateInput;
}) {
  const [mode, setMode] =
    useState<Status>("advisable");

  const applianceCardStyles =
    useApplianceCardStyles();

  const [index, setIndex] = useState(0);

  const [tipIndex, setTipIndex] = useState(0);

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
              badgeMeta(status).color,
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
            badgeMeta(status).color,
        };
      });
    }, [appliances, battery]);

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
  // ROTATING TIP
  // ============================================

  useEffect(() => {
    const timer = setInterval(() => {
      setTipIndex(
        (currentIndex) =>
          (currentIndex + 1) %
          tips.length,
      );
    }, 10000);

    return () =>
      clearInterval(timer);
  }, []);

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
        <View style={styles.wrapper}>
          <View style={styles.getStartedBox}>
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
                    color={Colors.light.onPrimary}
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
      <View style={styles.wrapper}>
        {/* Rotating Tip */}
        <View style={styles.tip}>
          <Ionicons
            name="bulb-outline"
            size={19}
            color={Colors.light.secondary}
          />

          <View style={styles.tipContent}>
            <AppText
              variant="caption"
              style={styles.tipTitle}
            >
              Tip
            </AppText>

            <AppText
              variant="caption"
              style={styles.tipText}
            >
              {tips[tipIndex]}
            </AppText>
          </View>
        </View>

        {/* Appliances / Empty State */}
        {filteredAppliances.length > 0 ? (
          <>
            <View style={styles.applianceRow}>
              {currentAppliances.map(
                (appliance) => {
                  const meta =
                    badgeMeta(
                      appliance.status,
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
                        color={Colors.light.onPrimary}
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
                            : Colors.light.border,
                      },
                    ]}
                  />
                );
              })}
            </View>
          </>
        ) : (
          <View
            style={
              styles.recommendationEmptyState
            }
          >
            <EmptyState
              icon="hardware-chip-outline"
              title={
                EMPTY_STATE_META[mode]
                  .title
              }
              description={
                EMPTY_STATE_META[mode]
                  .description
              }
            />
          </View>
        )}

        {/* Status Toggle */}
        <View style={styles.toggle}>
          {TOGGLE_META.map(
            ({
              mode: segmentMode,
              label,
              color,
              accessibilityLabel,
            }) => {
              const active =
                mode === segmentMode;

              return (
                <Pressable
                  key={segmentMode}
                  onPress={() =>
                    setMode(
                      segmentMode,
                    )
                  }
                  accessibilityRole="button"
                  accessibilityLabel={
                    accessibilityLabel
                  }
                  style={({ pressed }) => [
                    styles.toggleButton,
                    active && {
                      backgroundColor:
                        color,
                    },
                    pressed &&
                    styles.pressed,
                  ]}
                >
                  <AppText
                    variant="caption"
                    style={[
                      styles.toggleText,
                      active &&
                      (segmentMode ===
                        "care"
                        ? styles
                            .activeToggleTextCaution
                        : styles
                            .activeToggleText),
                    ]}
                  >
                    {label}
                  </AppText>
                </Pressable>
              );
            },
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

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    alignItems: "center",
    gap: 2,
  },

  // ============================================
  // FIXED RECOMMENDATION CONTAINER
  //
  // This represents your imaginary box.
  // Everything inside follows this fixed space.
  // ============================================

  fixedRecommendationContainer: {
    width: "100%",

    // Fixed total height based on your
    // intended Get Started layout.
    height: 380,

    justifyContent: "space-between",
  },

  // ============================================
  // TOP SECTION
  //
  // Always sticks to the top.
  // ============================================

  recommendationTopSection: {
    width: "100%",
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
    height: 33,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  // ============================================
  // BOTTOM SECTION
  //
  // Always sticks to bottom of the fixed container.
  // ============================================

  recommendationBottomSection: {
    width: "100%",
    alignItems: "center",
  },

  // ============================================
  // STATUS TOGGLE
  // ============================================

  toggle: {
    width: "100%",
    maxWidth: 360,
    height: 51,
    flexDirection: "row",
    backgroundColor: Colors.glass.white,
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderRadius: Radius.md,
    padding: 3,
  },

  toggleButton: {
    flex: 1,
    height: 41,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.md,
  },

  toggleText: {
    color: Colors.light.text,
    fontSize: 13,
    fontWeight: "700",
  },

  activeToggleText: {
    color: Colors.light.onPrimary,
  },

  activeToggleTextCaution: {
    color: Colors.light.text,
  },

  // ============================================
  // VIEW ALL
  // ============================================

  // ============================================
  // TIP
  // ============================================

  tip: {
    width: "100%",
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.glass.white,
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderRadius: Radius.md,
    padding: 10,
    marginTop: 5,
    marginBottom: 14,
  },

  tipContent: {
    flex: 1,
    marginLeft: 8,
  },

  tipTitle: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },

  tipText: {
    color: Colors.light.textSecondary,
    fontSize: 14,
    lineHeight: 17,
    flexShrink: 1,
  },

  // ============================================
  // EMPTY STATE
  // ============================================

  recommendationEmptyState: {

    width: "100%",
    height: 275,
  },

  // ============================================
  // MODE 1 - GET STARTED
  // ============================================

  getStartedBox: {
    width: "100%",
    height: 275,
    backgroundColor: Colors.light.surface,
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderRadius: Radius.md,
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  getStartedTitle: {
    color: Colors.light.text,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
  },

  addAppliancesButton: {
    height: 46,
    width: "100%",
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.md,
  },

  addAppliancesButtonText: {
    color: Colors.light.onPrimary,
    fontWeight: "700",
  },

  // ============================================
  // PRESS FEEDBACK
  // ============================================

  pressed: {
    opacity: 0.7,
  },
});