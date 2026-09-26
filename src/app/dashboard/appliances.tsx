import { Ionicons } from "@expo/vector-icons";
import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import ApplianceModal from "@/components/forms/ApplianceModal";
import ApplianceStatusBox from "@/components/forms/ApplianceStatusBox";
import {
  applianceCardGrid,
} from "@/components/forms/applianceCard";
import Copyright from "@/components/ui/Copyright";
import NavBar from "@/components/layout/Navbar";
import ScreenContainer2 from "@/components/layout/ScreenContainer2";
import AppText from "@/components/ui/AppText";
import { DropdownModal, RadioOptionRow } from "@/components/ui/DropdownModal";
import EmptyState from "@/components/ui/EmptyState";

import { Colors } from "@/constants/colors";
import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";
import {
  Radius,
} from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import {
  type BatteryStateInput,
  recommendAppliance,
} from "@/services/recommendation";
import {
  useMonitoring,
} from "@/services/monitoringService";

type PowerLevel =
  | "All"
  | "Highest"
  | "Moderate"
  | "Low";

type Area =
  | "All Areas"
  | "Living Area"
  | "Bedroom"
  | "Kitchen Area"
  | "Work/Study Area"
  | "Bathroom Area"
  | "Porch"
  | "Custom";

type SelectedAppliance = {
  id: string;
  name: string;
  watts: string;
  area: string;
};

type StatusFilter =
  | "Advisable"
  | "Caution"
  | "notAdvisable";

type ApplianceStatus =
  | "advisable"
  | "care"
  | "notAdvisable";

const STATUS_FOR_FILTER: Record<
  StatusFilter,
  ApplianceStatus
> = {
  Advisable: "advisable",
  Caution: "care",
  notAdvisable: "notAdvisable",
};

const TOGGLE_META_BASE: {
  filter: StatusFilter;
  label: string;
  tone: "primary" | "warning" | "error";
  accessibilityLabel: string;
}[] = [
  {
    filter: "Advisable",
    label: "Advisable",
    tone: "primary",
    accessibilityLabel:
      "Show advisable appliances",
  },
  {
    filter: "Caution",
    label: "Caution",
    tone: "warning",
    accessibilityLabel:
      "Show appliances to use with care",
  },
  {
    filter: "notAdvisable",
    label: "Not Advisable",
    tone: "error",
    accessibilityLabel:
      "Show not advisable appliances",
  },
];

const getToggleColor = (
  colors: AppColors,
  tone: "primary" | "warning" | "error",
) =>
  tone === "warning"
    ? colors.warning
    : tone === "error"
      ? colors.error
      : colors.primary;

const statusMeta = (
  status: ApplianceStatus,
) => {

  if (
    status === "care"
  ) {

    return {
      label: "Use with care",
      tone: "care" as const,
    };
  }

  if (
    status === "notAdvisable"
  ) {

    return {
      label: "Not advised",
      tone: "not" as const,
    };
  }

  return {
    label: "OK to use",
    tone: "ok" as const,
  };
};

/*
 * UI area names -> database area names
 */
const areaMap: Record<
  Exclude<Area, "All Areas">,
  string
> = {
  "Living Area": "Living Area",
  Bedroom: "Bedroom",
  "Kitchen Area": "Kitchen & Dining Area",
  "Work/Study Area": "Work & Study Area",
  "Bathroom Area": "Bathroom & Laundry Area",
  Porch: "Porch & Yard",
  Custom: "Custom Appliances",
};

export default function AppliancesScreen() {
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("Advisable");

  const colors = useAppColors();

  const styles = useMemo(
    () => getStyles(colors),
    [colors],
  );

  const {
    monitoring,
  } = useMonitoring();

  const [
    selectedAppliances,
    setSelectedAppliances,
  ] = useState<SelectedAppliance[]>([]);

  const [
    applianceModalVisible,
    setApplianceModalVisible,
  ] = useState(false);

  const [powerFilter, setPowerFilter] =
    useState<PowerLevel>("All");

  const [areaFilter, setAreaFilter] =
    useState<Area>("All Areas");

  const [
    powerModalVisible,
    setPowerModalVisible,
  ] = useState(false);

  const [
    areaModalVisible,
    setAreaModalVisible,
  ] = useState(false);

  const loadSelectedAppliances = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSelectedAppliances([]);
      return;
    }

    const { data, error } = await supabase
      .from("appliances")
      .select(
        "app_id, appliance_name, wattage, area",
      )
      .eq("user_id", user.id)
      .eq("selection", true)
      .order("area")
      .order("appliance_name");

    if (error) {
      console.error(
        "Failed to load selected appliances:",
        error.message,
      );
      return;
    }

    setSelectedAppliances(
      (data ?? []).map((item) => ({
        id: item.app_id,
        name: item.appliance_name,
        watts: item.wattage,
        area: item.area,
      })),
    );
  };

  const handleApplianceSave = async () => {
    await loadSelectedAppliances();
  };

  useEffect(() => {
    loadSelectedAppliances();
  }, []);

  const handlePowerFilter = (
    filter: PowerLevel,
  ) => {
    setPowerFilter(filter);
    setPowerModalVisible(false);
  };

  const handleAreaFilter = (filter: Area) => {
    setAreaFilter(filter);
    setAreaModalVisible(false);
  };

  // ==========================================================
  // RECOMMENDATION STATUS
  //
  // Live battery readings drive the engine verdict. When no
  // monitoring row exists yet, the legacy wattage heuristic
  // keeps the prior behavior until data arrives.
  // ==========================================================

  const getApplianceStatus = (
    appliance: SelectedAppliance,
  ): ApplianceStatus => {

    if (
      !monitoring
    ) {

      const watts =
        appliance.watts
          .match(/\d+/g)
          ?.map(Number) ?? [];

      const maxWatts = Math.max(
        ...watts,
        0,
      );

      return maxWatts < 300
        ? "advisable"
        : "notAdvisable";
    }

    const battery: BatteryStateInput = {
      soc: monitoring.battery_level,
      voltage: monitoring.voltage,
      remainingWh:
        monitoring.watt_hours,
      dod: monitoring.dod_status,
    };

    const recommendation =
      recommendAppliance(
        battery,
        {
          id: appliance.id,
          name: appliance.name,
          wattage: appliance.watts,
        },
      );

    if (
      recommendation.verdict ===
      "notRecommended"
    ) {

      return "notAdvisable";
    }

    if (
      recommendation.verdict ===
      "care"
    ) {

      return "care";
    }

    return "advisable";
  };

  const filteredAppliances =
    selectedAppliances.filter((appliance) => {
      const watts =
        appliance.watts.match(/\d+/g)?.map(Number) ??
        [];

      const maxWatts = Math.max(...watts, 0);

      const matchesPower =
        powerFilter === "All" ||
        (powerFilter === "Highest" &&
          maxWatts >= 50) ||
        (powerFilter === "Moderate" &&
          maxWatts >= 20 &&
          maxWatts < 50) ||
        (powerFilter === "Low" &&
          maxWatts < 20);

      const matchesArea =
        areaFilter === "All Areas" ||
        appliance.area === areaMap[areaFilter];

      const status =
        getApplianceStatus(appliance);

      const matchesStatus =
        status ===
        STATUS_FOR_FILTER[
          statusFilter
        ];

      return (
        matchesPower &&
        matchesArea &&
        matchesStatus
      );
    });

  return (
    <ScreenContainer2>
      <NavBar />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.card}>
          <AppText
            variant="heading"
            style={styles.title}
          >
            Appliances
          </AppText>

          <AppText
            variant="caption"
            style={styles.subtitle}
          >
            Manage and monitor supported appliances.
          </AppText>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {/* Add New */}
          <Pressable
            onPress={() =>
              setApplianceModalVisible(true)
            }
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="add-outline"
              size={18}
              color={colors.onPrimary}
            />

            <AppText
              variant="caption"
              style={styles.addButtonText}
            >
              Add New
            </AppText>
          </Pressable>

          {/* Power Filter */}
          <View style={styles.filterWrapper}>
            <Pressable
              onPress={() => {
                setPowerModalVisible(true);
                setAreaModalVisible(false);
              }}
              style={({ pressed }) => [
                styles.filterButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name="flash-outline"
                size={18}
                color={colors.primary}
              />

              <AppText
                variant="caption"
                style={styles.filterText}
              >
                {powerFilter}
              </AppText>

              <Ionicons
                name="chevron-down-outline"
                size={17}
                color={colors.text}
              />
            </Pressable>
          </View>

          {/* Area Filter */}
          <View style={styles.filterWrapper}>
            <Pressable
              onPress={() => {
                setAreaModalVisible(true);
                setPowerModalVisible(false);
              }}
              style={({ pressed }) => [
                styles.filterButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name="location-outline"
                size={18}
                color={colors.primary}
              />

              <AppText
                variant="caption"
                style={styles.filterText}
              >
                {areaFilter}
              </AppText>

              <Ionicons
                name="chevron-down-outline"
                size={17}
                color={colors.text}
              />
            </Pressable>
          </View>
        </View>

        {/* Status Filter */}
        <View style={styles.statusToggle}>
          {TOGGLE_META_BASE.map(
            ({
              filter,
              label,
              tone,
              accessibilityLabel,
            }) => {
              const active =
                statusFilter === filter;
              const color =
                getToggleColor(
                  colors,
                  tone,
                );

              return (
                <Pressable
                  key={filter}
                  onPress={() =>
                    setStatusFilter(
                      filter,
                    )
                  }
                  accessibilityRole="button"
                  accessibilityLabel={
                    accessibilityLabel
                  }
                  style={({ pressed }) => [
                    styles.statusButton,
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
                      styles.statusText,
                      active &&
                      (filter === "Caution"
                        ? styles
                            .activeStatusTextCaution
                        : styles
                            .activeStatusText),
                    ]}
                  >
                    {label}
                  </AppText>
                </Pressable>
              );
            },
          )}
        </View>

        {/* Appliances */}
        <View style={[applianceCardGrid, { marginTop: 20 }]}>
          {filteredAppliances.length === 0 ? (
            <EmptyState
              title={
                selectedAppliances.length === 0
                  ? "No Appliances"
                  : statusFilter ===
                      "Advisable"
                    ? "No Advisable Appliances"
                    : statusFilter ===
                        "Caution"
                      ? "No Appliances to Use With Care"
                      : "No Not Advisable Appliances"
              }
              description={
                selectedAppliances.length === 0
                  ? "No appliances have been selected yet."
                  : "No appliances match the selected filters."
              }
              icon={
                selectedAppliances.length === 0
                  ? "cube-outline"
                  : statusFilter ===
                      "Advisable"
                    ? "checkmark-circle-outline"
                    : statusFilter ===
                        "Caution"
                      ? "warning-outline"
                      : "alert-circle-outline"
              }
            />
          ) : (
            filteredAppliances.map((appliance) => {
              const status =
                getApplianceStatus(appliance);

              const statusMapped =
                statusMeta(status);

              return (
                <ApplianceStatusBox
                  key={appliance.id}
                  name={appliance.name}
                  wattage={appliance.watts}
                  status={
                    statusMapped.label
                  }
                  statusTone={
                    statusMapped.tone
                  }
                />
              );
            })
          )}
        </View>

        <Copyright />
      </ScrollView>

      <ApplianceModal
        visible={applianceModalVisible}
        onClose={() =>
          setApplianceModalVisible(false)
        }
        onSave={handleApplianceSave}
        selectedAppliances={selectedAppliances}
      />

      {/* ========================================================
          POWER LEVEL MODAL
      ======================================================== */}
      <DropdownModal
        visible={powerModalVisible}
        title="Power Level"
        onClose={() =>
          setPowerModalVisible(false)
        }
      >
        {(
          [
            "All",
            "Highest",
            "Moderate",
            "Low",
          ] as PowerLevel[]
        ).map((option) => (
          <RadioOptionRow
            key={option}
            label={option}
            selected={
              powerFilter === option
            }
            onPress={() =>
              handlePowerFilter(option)
            }
          />
        ))}
      </DropdownModal>

      {/* ========================================================
          AREA MODAL
      ======================================================== */}
      <DropdownModal
        visible={areaModalVisible}
        title="Area"
        onClose={() =>
          setAreaModalVisible(false)
        }
      >
        {(
          [
            "All Areas",
            "Living Area",
            "Bedroom",
            "Kitchen Area",
            "Work/Study Area",
            "Bathroom Area",
            "Porch",
            "Custom",
          ] as Area[]
        ).map((option) => (
          <RadioOptionRow
            key={option}
            label={option}
            selected={areaFilter === option}
            onPress={() =>
              handleAreaFilter(option)
            }
          />
        ))}
      </DropdownModal>
    </ScreenContainer2>
  );
}

const dimensions = {
  padding: 16,
  radius: 16,
  borderWidth: 3,
  gap: 10,
};

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    scrollView: {
      flex: 1,
      backgroundColor: colors.background,
    },

  content: {
    padding: dimensions.padding,
    paddingBottom: 24,
  },

  sectionHeader: {
    marginBottom: 12,
  },

  card: {
    backgroundColor: colors.glass.white,
    borderWidth: dimensions.borderWidth,
    borderColor: colors.primary,
    borderRadius: dimensions.radius,
    padding: 18,
    marginBottom: 16,
  },

  title: {
    color: colors.text,
    fontWeight: "700",
  },

  subtitle: {
    color: colors.textSecondary,
    marginTop: 6,
  },

  controls: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: dimensions.gap,
    marginBottom: 18,
    zIndex: 20,
  },

  addButton: {
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 12,
  },

  addButtonText: {
    color: colors.onPrimary,
    fontWeight: "700",
  },

  filterWrapper: {
    flex: 1,
    position: "relative",
  },

  filterButton: {
    height: 46,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.glass.white,
    borderWidth: dimensions.borderWidth,
    borderColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 11,
    gap: 6,
  },

  filterText: {
    flex: 1,
    color: colors.text,
    fontWeight: "600",
  },

  pressed: {
    opacity: 0.7,
  },

  applianceSection: {
    width: "100%",
    marginBottom: 18,
  },

  sectionTitle: {
    color: colors.text,
    fontWeight: "700",
    marginBottom: 10,
  },

  statusToggle: {
    width: "100%",
    maxWidth: 360,
    alignSelf: "center",
    height: 51,
    flexDirection: "row",
    backgroundColor: colors.glass.white,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: Radius.md,
    padding: 3,
    marginTop: 10,
  },

  statusButton: {
    flex: 1,
    height: 41,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.md,
  },

  statusText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },

  activeStatusText: {
    color: colors.onPrimary,
  },

  // Frozen: dark ink on the amber caution fill in both themes.
  activeStatusTextCaution: {
    color: Colors.light.text,
  },
});