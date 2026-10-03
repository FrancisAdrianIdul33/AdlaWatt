import { Ionicons } from "@expo/vector-icons";
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import ApplianceBox from "@/components/forms/ApplianceBox";
import {
  applianceCardGrid,
} from "@/components/forms/applianceCard";
import CustomApplianceModal from "@/components/forms/CustomApplianceModal";
import AppText from "@/components/ui/AppText";
import EmptyState from "@/components/ui/EmptyState";
import SearchBox from "@/components/ui/SearchBox";

import { Colors } from "@/constants/colors";
import {
  CUSTOM_AREA,
  GIVEN_CATALOG,
  type CatalogItem,
} from "@/constants/applianceCatalog";
import { logAppliance } from "@/services/activityLogService";
import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";
import {
  Radius,
  Spacing,
  Typography,
} from "@/constants/theme";
import { Control, Field, Touch } from "@/constants/sizing";

import { getAuthenticatedUserSafe, supabase } from "@/lib/supabase";

type Appliance = {
  id: string;
  name: string;
  watts: string;
  area: string;
};

type ApplianceModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave?: (appliances: Appliance[]) => void;
  onCustomAdd?: (appliance: Appliance) => void;
  onCustomUpdate?: (
    appliance: Appliance,
  ) => void;
  onCustomDelete?: (id: string) => void;
  selectedAppliances?: Appliance[];
};

/*
 * v5 schema: DB holds user picks only, no wattage column.
 *  - given  = { catalog_key LIKE 'catalog:%',
 *               wattage_min/max from GIVEN_CATALOG }
 *  - custom = { catalog_key NULL, wattage_min/max interval }
 * Catalog wattage/area always come from GIVEN_CATALOG in code.
 *
 * v6 archive flag: archive = true means archived (hidden).
 * The DB trigger stores archive := NOT selection, so only
 * selected customs (archive = false) are listed. Deselecting
 * archives the row at once. An archives viewer is future work.
 */
const toFiniteNumber = (value: unknown): number | null => {
  const num =
    typeof value === "number"
      ? value
      : Number(String(value ?? "").replace(/W$/i, "").trim());

  return Number.isFinite(num) && num > 0 ? num : null;
};

const formatIntervalWatts = (
  min: number,
  max: number,
): string => `${min}-${max}W`;

const formatCustomWatts = (
  wattMin: unknown,
  wattMax: unknown,
): string => {
  const min = toFiniteNumber(wattMin);
  const max = toFiniteNumber(wattMax);

  if (min !== null && max !== null && max >= min) {
    return formatIntervalWatts(min, max);
  }

  return "";
};

/* Parses "15-25" / "15 - 25" / "15.5-25.5" into { min, max }. */
const parseWattInterval = (
  raw: string,
): { min: number; max: number } | null => {
  const match = raw.match(
    /^(\d+(?:\.\d{1,2})?)\s*-\s*(\d+(?:\.\d{1,2})?)$/,
  );

  if (!match) {
    return null;
  }

  const min = Number(match[1]);
  const max = Number(match[2]);

  if (
    !Number.isFinite(min) ||
    !Number.isFinite(max) ||
    min < 1 ||
    max > 720 ||
    min > max
  ) {
    return null;
  }

  return { min, max };
};

/*
 * UI area colors
 */
const areaColors: Record<string, string> = {
  "Living Area": Colors.light.areas.living,
  "Bedroom": Colors.light.areas.bedroom,
  "Kitchen Area": Colors.light.areas.kitchen,
  "Work/Study Area": Colors.light.areas.study,
  "Bathroom Area": Colors.light.areas.bathroom,
  "Porch": Colors.light.areas.porch,
};

const getAreaColor = (
  area: string,
  fallback: string,
) =>
  areaColors[area] ?? fallback;

const catalogToAppliance = (
  item: CatalogItem,
): Appliance => ({
  id: item.key,
  name: item.name,
  watts: item.display,
  area: item.uiArea,
});

export default function ApplianceModal({
  visible,
  onClose,
  selectedAppliances = [],
  onCustomAdd,
  onCustomUpdate,
  onCustomDelete,
  onSave,
}: ApplianceModalProps) {
  const [selected, setSelected] = useState<
    string[]
  >([]);

  const [appliances, setAppliances] = useState<
    Appliance[]
  >([]);

  const [searchText, setSearchText] =
    useState("");

  const [addModalVisible, setAddModalVisible] =
    useState(false);

  const [editModalVisible, setEditModalVisible] =
    useState(false);

  const [customName, setCustomName] =
    useState("");

  const [customWatts, setCustomWatts] =
    useState("");

  const [customError, setCustomError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  // True while custom appliances are being fetched, so the
  // section can show a loading state instead of flashing empty.
  const [isLoadingCustoms, setIsLoadingCustoms] =
    useState(false);

  const [editingCustom, setEditingCustom] =
    useState<Appliance | null>(null);

  const [isReset, setIsReset] =
    useState(false);

  // Customs the user archived (archive = true through
  // the DB trigger). Archived rows are hidden from the list
  // until the archives viewer lands.
  const [archivedCount, setArchivedCount] =
    useState(0);

  const scrollRef = useRef<ScrollView>(null);

  const colors = useAppColors();

  const styles = useMemo(
    () => getStyles(colors),
    [colors],
  );

  // Custom section follows the themed brand primary so it
  // stays correct in both light and dark mode.
  const areaColor = (area: string) =>
    area === "Custom Appliances"
      ? colors.primary
      : getAreaColor(area, colors.border);

  // ============================================================
  // LOAD APPLIANCES
  // ============================================================

  const loadAppliances = async () => {
    setIsLoadingCustoms(true);

    const user = await getAuthenticatedUserSafe();

    if (!user) {
      setAppliances([]);
      setArchivedCount(0);
      setIsLoadingCustoms(false);
      return;
    }

    const { data, error } = await supabase
      .from("appliances")
      .select(
        "app_id, appliance_name, type, catalog_key, wattage_min, wattage_max, selection, archive",
      )
      .eq("user_id", user.id)
      .order("appliance_name");

    if (error) {
      console.error(
        "Failed to load appliances:",
        error.message,
      );
      setIsLoadingCustoms(false);
      return;
    }

    const rows = data ?? [];

    const pickedCatalogKeys = rows
      .filter(
        (item) =>
          typeof item.catalog_key === "string" &&
          item.catalog_key.startsWith("catalog:"),
      )
      .map((item) => String(item.catalog_key));

    // Archived customs (archive = true) are hidden from
    // the list until the archives viewer lands.
    const customs: Appliance[] = rows
      .filter(
        (item) =>
          item.type === "custom" &&
          item.archive !== true,
      )
      .map((item) => ({
        id: String(item.app_id),
        name: String(item.appliance_name),
        watts: formatCustomWatts(
          item.wattage_min,
          item.wattage_max,
        ),
        area: CUSTOM_AREA,
      }));

    const selectedCustomIds = rows
      .filter(
        (item) =>
          item.type === "custom" &&
          item.selection === true,
      )
      .map((item) => String(item.app_id));

    setAppliances(customs);
    setSelected([
      ...pickedCatalogKeys,
      ...selectedCustomIds,
    ]);
    setArchivedCount(
      rows.filter(
        (item) =>
          item.type === "custom" &&
          item.archive === true,
      ).length,
    );
    setIsLoadingCustoms(false);
  };

  // ============================================================
  // MODAL STATE
  // ============================================================

  useEffect(() => {
    if (visible) {
      loadAppliances();

      setSelected(
        selectedAppliances.map(({ id }) => id),
      );

      setSearchText("");
      return;
    }

    setSelected([]);
    setSearchText("");
    setEditModalVisible(false);
    setAddModalVisible(false);
    setCustomName("");
    setCustomWatts("");
    setCustomError("");
    setSuccessMessage("");
    setEditingCustom(null);
    setIsReset(false);
  }, [visible, selectedAppliances]);

  // ============================================================
  // TOGGLE APPLIANCE
  // ============================================================

  const toggleAppliance = (id: string) => {
    setSelected((current) =>
      current.includes(id)
        ? current.filter(
          (item) => item !== id,
        )
        : [...current, id],
    );
  };

  // ============================================================
  // RESET SELECTION
  // ============================================================

  const handleReset = async () => {
    const user = await getAuthenticatedUserSafe();

    if (!user) {
      setCustomError("You must be signed in.");
      return;
    }

    const { error } = await supabase.rpc(
      "reset_appliance_selection",
    );

    if (error) {
      console.error(
        "Reset appliance selection error:",
        error.message,
      );

      setCustomError(
        "Unable to reset appliance selection.",
      );

      return;
    }

    setSelected([]);
    setCustomName("");
    setCustomWatts("");
    setCustomError("");
    setEditModalVisible(false);
    setAddModalVisible(false);
    setEditingCustom(null);
    setIsReset(true);
    // Catalog picks are deleted; every remaining custom
    // becomes archive = true (hidden) through the DB trigger.
    setAppliances([]);
    setArchivedCount(appliances.length);

    logAppliance.selectionReset();
  };

  // ============================================================
  // SAVE APPLIANCE SELECTION
  // ============================================================

  const handleSave = async () => {
    const user = await getAuthenticatedUserSafe();

    if (!user) {
      console.error("No authenticated user.");
      return;
    }

    const selectedSet = new Set(selected);

    const catalogPicks = GIVEN_CATALOG.filter(
      (item) => selectedSet.has(item.key),
    ).map((item) => ({
      key: item.key,
      name: item.name,
      wattMin: item.wattMin,
      wattMax: item.wattMax,
    }));

    const customSelected = appliances
      .filter((item) => selectedSet.has(item.id))
      .map((item) => item.id);

    const { error: saveError } = await supabase.rpc(
      "save_appliance_selection",
      {
        p_catalog: catalogPicks,
        p_custom_selected: customSelected,
      },
    );

    if (saveError) {
      console.error(
        "Save appliance selection error:",
        saveError.message,
      );

      setCustomError(
        "Unable to save appliance selection.",
      );

      return;
    }

    const selectedItems = displayAppliances.filter(
      (item) => selected.includes(item.id),
    );

    logAppliance.selectionSaved(selectedItems.length);

    onSave?.(selectedItems);
    onClose();
  };

  // ============================================================
  // CANCEL EDIT MODAL
  // ============================================================

  const handleEditCancel = () => {
    setCustomName("");
    setCustomWatts("");
    setCustomError("");
    setEditingCustom(null);
    setEditModalVisible(false);
  };

  // ============================================================
  // ADD MODAL (ADD-ONLY, DropdownModal shell like CalendarModal)
  // ============================================================

  const handleAddOpen = () => {
    setEditingCustom(null);
    setCustomName("");
    setCustomWatts("");
    setCustomError("");
    setAddModalVisible(true);
  };

  const handleAddCancel = () => {
    setCustomName("");
    setCustomWatts("");
    setCustomError("");
    setAddModalVisible(false);
  };

  // ============================================================
  // ADD CUSTOM APPLIANCE
  // ============================================================

  const handleCustomAdd = async () => {
    const name = customName.trim();
    const wattsRaw = customWatts.trim();

    if (
      !/^[A-Za-z][A-Za-z0-9 /&.'-]{2,49}$/.test(
        name,
      )
    ) {
      setCustomError(
        "Appliance name must be valid and readable.",
      );
      return;
    }

    if (!/^\d+(\.\d{1,2})?\s*-\s*\d+(\.\d{1,2})?$/.test(wattsRaw)) {
      setCustomError(
        "Enter wattage interval, for example 15-25.",
      );
      return;
    }

    const interval = parseWattInterval(wattsRaw);

    if (!interval) {
      setCustomError(
        "Enter a valid wattage interval between 1W and 720W.",
      );
      return;
    }

    const user = await getAuthenticatedUserSafe();

    if (!user) {
      setCustomError(
        "You must be signed in to add an appliance.",
      );
      return;
    }

    const {
      data: duplicate,
      error: duplicateError,
    } = await supabase
      .from("appliances")
      .select("app_id")
      .eq("user_id", user.id)
      .eq("type", "custom")
      .ilike("appliance_name", name)
      .maybeSingle();

    if (duplicateError) {
      console.error(
        "Duplicate appliance check error:",
        duplicateError.message,
      );

      setCustomError(
        "Unable to check appliance name.",
      );

      return;
    }

    if (duplicate) {
      setCustomError(
        "This appliance already exists.",
      );
      return;
    }

    const { data, error } = await supabase
      .from("appliances")
      .insert({
        user_id: user.id,
        appliance_name: name,
        type: "custom",
        wattage_min: interval.min,
        wattage_max: interval.max,
        // New customs start selected: under the v6 archive
        // flag an unselected row would be archive = true and
        // hidden from the list at once.
        selection: true,
      })
      .select(
        "app_id, appliance_name, wattage_min, wattage_max",
      )
      .single();

    if (error) {
      console.error(
        "Custom appliance error:",
        error.message,
      );

      setCustomError(
        "Unable to add appliance. Please try again.",
      );

      return;
    }

    const appliance: Appliance = {
      id: String(data.app_id),
      name: String(data.appliance_name),
      watts: formatCustomWatts(
        data.wattage_min,
        data.wattage_max,
      ),
      area: CUSTOM_AREA,
    };

    onCustomAdd?.(appliance);

    logAppliance.added(name, appliance.watts);

    setAppliances((current) => [
      ...current,
      appliance,
    ]);

    setSelected((current) => [
      ...new Set([...current, appliance.id]),
    ]);

    setCustomName("");
    setCustomWatts("");
    setCustomError("");
    setAddModalVisible(false);

    setSuccessMessage(
      `${name} successfully added!`,
    );

    setTimeout(() => {
      setSuccessMessage("");
    }, 5000);
  };

  // ============================================================
  // UPDATE CUSTOM APPLIANCE
  // ============================================================

  const handleCustomUpdate = async () => {
    if (!editingCustom) return;

    const name = customName.trim();
    const wattsRaw = customWatts.trim();

    if (
      !/^[A-Za-z][A-Za-z0-9 /&.'-]{2,49}$/.test(
        name,
      )
    ) {
      setCustomError(
        "Enter a valid appliance name.",
      );
      return;
    }

    if (!/^\d+(\.\d{1,2})?\s*-\s*\d+(\.\d{1,2})?$/.test(wattsRaw)) {
      setCustomError(
        "Enter wattage interval, for example 15-25.",
      );
      return;
    }

    const interval = parseWattInterval(wattsRaw);

    if (!interval) {
      setCustomError(
        "Enter a valid wattage interval between 1W and 720W.",
      );
      return;
    }

    const user = await getAuthenticatedUserSafe();

    if (!user) {
      setCustomError(
        "You must be signed in to update an appliance.",
      );
      return;
    }

    const {
      data: duplicate,
      error: duplicateError,
    } = await supabase
      .from("appliances")
      .select("app_id")
      .eq("user_id", user.id)
      .eq("type", "custom")
      .ilike("appliance_name", name)
      .neq("app_id", editingCustom.id)
      .maybeSingle();

    if (duplicateError) {
      console.error(
        "Duplicate appliance check error:",
        duplicateError.message,
      );

      setCustomError(
        "Unable to check appliance name.",
      );

      return;
    }

    if (duplicate) {
      setCustomError(
        "This appliance already exists.",
      );
      return;
    }

    const { data, error } = await supabase
      .from("appliances")
      .update({
        appliance_name: name,
        wattage_min: interval.min,
        wattage_max: interval.max,
      })
      .eq("app_id", editingCustom.id)
      .eq("user_id", user.id)
      .eq("type", "custom")
      .select(
        "app_id, appliance_name, wattage_min, wattage_max",
      )
      .single();

    if (error) {
      console.error(
        "Custom appliance update error:",
        error.message,
      );

      setCustomError(
        "Unable to update appliance. Please try again.",
      );

      return;
    }

    const updated: Appliance = {
      id: String(data.app_id),
      name: String(data.appliance_name),
      watts: formatCustomWatts(
        data.wattage_min,
        data.wattage_max,
      ),
      area: CUSTOM_AREA,
    };

    setAppliances((current) =>
      current.map((item) =>
        item.id === updated.id
          ? updated
          : item,
      ),
    );

    onCustomUpdate?.(updated);

    logAppliance.updated(name);

    setEditingCustom(null);
    setCustomName("");
    setCustomWatts("");
    setCustomError("");
    setEditModalVisible(false);

    setSuccessMessage(
      `${name} successfully updated!`,
    );

    setTimeout(() => {
      setSuccessMessage("");
    }, 5000);
  };

  // ============================================================
  // DELETE CUSTOM APPLIANCE
  // ============================================================

  const handleCustomDelete = async (
    id: string,
  ) => {
    const user = await getAuthenticatedUserSafe();

    if (!user) {
      setCustomError(
        "You must be signed in to delete an appliance.",
      );
      return;
    }

    const { error } = await supabase
      .from("appliances")
      .delete()
      .eq("app_id", id)
      .eq("user_id", user.id)
      .eq("type", "custom");

    if (error) {
      console.error(
        "Custom appliance delete error:",
        error.message,
      );

      setCustomError(
        "Unable to delete appliance. Please try again.",
      );

      return;
    }

    const removed = appliances.find(
      (item) => item.id === id,
    );

    setAppliances((current) =>
      current.filter((item) => item.id !== id),
    );

    setSelected((current) =>
      current.filter((item) => item !== id),
    );

    logAppliance.removed(
      removed?.name ?? "Custom appliance",
    );

    onCustomDelete?.(id);
  };

  // ============================================================
  // ARCHIVE CUSTOM APPLIANCE
  // ============================================================
  //
  // Deselecting stores archive = true through the v6 DB
  // trigger, which hides the row from the list at once.
  // Recovery waits for the archives viewer.
  // ============================================================

  const handleCustomArchive = async (
    id: string,
  ) => {
    const user = await getAuthenticatedUserSafe();

    if (!user) {
      setCustomError(
        "You must be signed in to archive an appliance.",
      );
      return;
    }

    const target = appliances.find(
      (item) => item.id === id,
    );

    const { error } = await supabase
      .from("appliances")
      .update({
        selection: false,
      })
      .eq("app_id", id)
      .eq("user_id", user.id)
      .eq("type", "custom");

    if (error) {
      console.error(
        "Custom appliance archive error:",
        error.message,
      );

      setCustomError(
        "Unable to archive appliance. Please try again.",
      );

      return;
    }

    const name =
      target?.name ?? "Custom appliance";

    setAppliances((current) =>
      current.filter((item) => item.id !== id),
    );

    setSelected((current) =>
      current.filter((item) => item !== id),
    );

    setArchivedCount(
      (current) => current + 1,
    );

    logAppliance.archived(name);

    setSuccessMessage(
      `${name} archived.`,
    );

    setTimeout(() => {
      setSuccessMessage("");
    }, 5000);
  };

  // ============================================================
  // OPEN CUSTOM EDITOR (EDIT MODAL)
  // ============================================================
  //
  // Opens the shared add/edit dialog prefilled with the custom
  // appliance values, using the exact same layout as adding.
  // ============================================================

  const openCustomEditor = (
    appliance: Appliance,
  ) => {
    setEditingCustom(appliance);
    setCustomName(appliance.name);

    setCustomWatts(
      appliance.watts.replace(/W$/, ""),
    );

    setCustomError("");
    setEditModalVisible(true);
  };

  // ============================================================
  // AREA SECTIONS
  // ============================================================

  const sections = [
    "Living Area",
    "Bedroom",
    "Kitchen Area",
    "Work/Study Area",
    "Bathroom Area",
    "Porch",
  ];

  // ============================================================
  // SEARCH FILTER
  // ============================================================

  const normalizedSearch = searchText
    .trim()
    .toLowerCase();

  // ============================================================
  // DISPLAY LIST (catalog-first, slim schema)
  // ============================================================
  //
  // Catalog always renders from GIVEN_CATALOG in code.
  // DB only holds user picks: given rows (catalog_key) for
  // selection state, custom rows for user-created items.
  // `appliances` state holds customs only.
  // ============================================================

  const displayAppliances: Appliance[] = [
    ...GIVEN_CATALOG.map(catalogToAppliance),
    ...appliances,
  ];

  const filteredAppliances =
    displayAppliances.filter(
      (appliance) =>
        !normalizedSearch ||
        appliance.name
          .toLowerCase()
          .includes(normalizedSearch),
    );

  // Customs visible in the section. Loading/empty states own
  // this list only when not searching; search results keep the
  // previous hide-when-no-match behavior.
  const customAppliances = filteredAppliances.filter(
    (item) => item.area === CUSTOM_AREA,
  );

  const showCustomStates = normalizedSearch === "";

  // ============================================================
  // SELECT ALL (UNION-VISIBLE)
  // ============================================================
  //
  // No filter: selects every catalog + custom box. Filtering:
  // adds only visible boxes, unioned with existing picks so
  // pre-search selections are never dropped. Local-only like
  // toggleAppliance — persisted on Save.
  // ============================================================

  const handleSelectAll = () => {
    const target = normalizedSearch
      ? filteredAppliances
      : displayAppliances;

    if (target.length === 0) {
      return;
    }

    setSelected((current) => [
      ...new Set([
        ...current,
        ...target.map(({ id }) => id),
      ]),
    ]);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <AppText
              variant="heading"
              style={styles.title}
            >
              Add Appliances
            </AppText>

            <Pressable
              onPress={onClose}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close Add Appliances"
            >
              <Ionicons
                name="close"
                size={24}
                color={colors.headerContent}
              />
            </Pressable>
          </View>

          {/* Content */}
          <ScrollView
            ref={scrollRef}
            style={styles.content}
            contentContainerStyle={
              styles.contentContainer
            }
            showsVerticalScrollIndicator
          >
            {/* Battery Advisory */}
            <View style={styles.advisory}>
              <View style={styles.advisoryRow}>
                <Ionicons
                  name="battery-half-outline"
                  size={24}
                  color={colors.accentContent}
                />

                <View style={styles.advisoryText}>
                  <AppText
                    variant="body"
                    style={styles.advisoryTitle}
                  >
                    Battery Capacity: 720 Wh
                  </AppText>

                  <AppText
                    variant="caption"
                    style={
                      styles.advisoryDescription
                    }
                  >
                    Select the appliances you want to use
                    and keep them within the available
                    energy capacity.
                  </AppText>
                </View>
              </View>
            </View>

            {/* Search + Archives */}
            <View style={styles.searchRow}>
              <View style={styles.searchBoxFlex}>
                <SearchBox
                  value={searchText}
                  onChangeText={setSearchText}
                  placeholder="Search appliances..."
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="Search appliances"
                />
              </View>

              <Pressable
                onPress={() => {}}
                style={({ pressed }) => [
                  styles.archiveButton,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Archives"
              >
                <Ionicons
                  name="archive-outline"
                  size={20}
                  color={colors.onPrimary}
                />
              </Pressable>
            </View>

            {/* Custom Appliance */}
            <View style={styles.customSection}>
              <Pressable
                onPress={handleAddOpen}
                style={({ pressed }) => [
                  styles.customButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={20}
                  color={colors.onPrimary}
                />

                <AppText
                  variant="caption"
                  style={styles.customButtonText}
                >
                  Add Custom Appliance
                </AppText>
              </Pressable>
            </View>

            {/* Success Message */}
            {successMessage ? (
              <View style={styles.successPanel}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color={colors.accentContent}
                />

                <AppText
                  variant="caption"
                  style={styles.successText}
                >
                  {successMessage}
                </AppText>
              </View>
            ) : null}

            {/* Custom Appliances (header always shows) */}
            {(showCustomStates ||
              customAppliances.length > 0) && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <AppText
                      variant="body"
                      style={styles.sectionTitle}
                    >
                      Custom Appliances
                    </AppText>

                    <View
                      style={[
                        styles.sectionLine,
                        {
                          backgroundColor:
                            colors.border,
                        },
                      ]}
                    />
                  </View>

                  {isLoadingCustoms &&
                  showCustomStates ? (
                    <EmptyState
                      title="Loading Custom Appliances"
                      description="Fetching your custom appliances…"
                      icon="sync-outline"
                      style={styles.customState}
                    />
                  ) : customAppliances.length > 0 ? (
                    <View style={styles.grid}>
                      {customAppliances.map(
                        (appliance) => {
                          const isSelected =
                            selected.includes(
                              appliance.id,
                            );

                          return (
                            <ApplianceBox
                              key={appliance.id}
                              name={appliance.name}
                              wattage={appliance.watts}
                              color={
                                colors.primary
                              }
                              selected={isSelected}
                              isCustom
                              onPress={() =>
                                toggleAppliance(
                                  appliance.id,
                                )
                              }
                              onEdit={() =>
                                openCustomEditor(
                                  appliance,
                                )
                              }
                              onDelete={() =>
                                handleCustomDelete(
                                  appliance.id,
                                )
                              }
                              onArchive={() =>
                                handleCustomArchive(
                                  appliance.id,
                                )
                              }
                            />
                          );
                        },
                      )}
                    </View>
                  ) : showCustomStates ? (
                    <EmptyState
                      title="No Custom Appliances"
                      description="You haven't added any yet. Tap Add Custom Appliance above to create one."
                      icon="cube-outline"
                      style={styles.customState}
                    />
                  ) : null}
                </View>
              )}

            {/* Appliance Categories */}
            {sections.map((section) => {
              const items =
                filteredAppliances.filter(
                  (item) =>
                    item.area === section,
                );

              if (items.length === 0) {
                return null;
              }

              return (
                <View
                  key={section}
                  style={styles.section}
                >
                  <View style={styles.sectionHeader}>
                    <AppText
                      variant="body"
                      style={styles.sectionTitle}
                    >
                      {section}
                    </AppText>

                      <View
                        style={[
                          styles.sectionLine,
                          {
                            backgroundColor:
                              areaColor(section),
                          },
                        ]}
                      />
                  </View>

                  <View style={styles.grid}>
                    {items.map((appliance) => {
                      const isSelected =
                        selected.includes(
                          appliance.id,
                        );

                      return (
                        <ApplianceBox
                          key={appliance.id}
                          name={appliance.name}
                          wattage={appliance.watts}
                          color={areaColor(
                            appliance.area,
                          )}
                          selected={isSelected}
                          onPress={() =>
                            toggleAppliance(
                              appliance.id,
                            )
                          }
                        />
                      );
                    })}
                  </View>
                </View>
              );
            })}

            {/* No Search Results */}
            {normalizedSearch.length > 0 &&
              filteredAppliances.length === 0 && (
                <View style={styles.noResults}>
                  <Ionicons
                    name="search-outline"
                    size={28}
                    color={
                      colors.textSecondary
                    }
                  />

                  <AppText
                    variant="caption"
                    style={styles.noResultsText}
                  >
                    {`No appliances found for "${searchText.trim()}"`}
                  </AppText>
                </View>
              )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.selectedInfo}>
              <View
                style={styles.selectedGroup}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={17}
                  color={colors.headerContent}
                />

                <AppText
                  variant="caption"
                  style={styles.selectedText}
                >
                  {selected.length} appliance
                  {selected.length !== 1
                    ? "s"
                    : ""}{" "}
                  selected
                </AppText>
              </View>

              <View
                style={styles.selectedGroup}
                accessibilityRole="text"
                accessibilityLabel={`${archivedCount} appliances archived`}
              >
                <Ionicons
                  name="archive-outline"
                  size={17}
                  color={colors.headerContent}
                />

                <AppText
                  variant="caption"
                  style={styles.selectedText}
                >
                  {archivedCount} appliance
                  {archivedCount !== 1 ? "s" : ""}{" "}
                  archived
                </AppText>
              </View>
            </View>

            <View style={styles.footerButtons}>
              <Pressable
                onPress={handleSelectAll}
                style={({ pressed }) => [
                  styles.resetButton,
                  pressed && styles.buttonPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Select all appliances"
              >
                <AppText
                  variant="caption"
                  style={styles.resetText}
                >
                  Select All
                </AppText>
              </Pressable>

              <Pressable
                onPress={handleReset}
                style={({ pressed }) => [
                  styles.resetButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <AppText
                  variant="caption"
                  style={styles.resetText}
                >
                  Reset
                </AppText>
              </Pressable>

              <Pressable
                onPress={handleSave}
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <AppText
                  variant="caption"
                  style={styles.actionText}
                >
                  {isReset ? "Save" : "Add"}
                </AppText>
              </Pressable>
            </View>
          </View>
        </View>

        <CustomApplianceModal
          visible={addModalVisible}
          name={customName}
          watts={customWatts}
          error={customError}
          onNameChange={(text) => {
            setCustomName(text);
            setCustomError("");
          }}
          onWattsChange={(text) => {
            const value = text.replace(
              /[^\d.-]/g,
              "",
            );

            setCustomWatts(value);
            setCustomError("");
          }}
          onCancel={handleAddCancel}
          onAdd={handleCustomAdd}
        />

        <CustomApplianceModal
          visible={editModalVisible}
          mode="edit"
          name={customName}
          watts={customWatts}
          error={customError}
          onNameChange={(text) => {
            setCustomName(text);
            setCustomError("");
          }}
          onWattsChange={(text) => {
            const value = text.replace(
              /[^\d.-]/g,
              "",
            );

            setCustomWatts(value);
            setCustomError("");
          }}
          onCancel={handleEditCancel}
          onAdd={handleCustomAdd}
          onSave={handleCustomUpdate}
        />
      </View>
    </Modal>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },

  modal: {
    height: "92%",
    backgroundColor: colors.background,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    overflow: "hidden",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: colors.headerBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.headerBackground,
  },

  title: {
    fontSize: Typography.heading,
    fontWeight: "700",
    color: colors.headerContent,
  },

  closeButton: {
    width: Touch.target,
    height: Touch.target,
    alignItems: "center",
    justifyContent: "center",
  },

  content: {
    flex: 1,
    backgroundColor: colors.background,
  },

  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    backgroundColor: colors.background,
  },

  advisory: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    borderRadius: Radius.md,
    padding: 13,
    marginBottom: Spacing.lg,
  },

  advisoryRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  advisoryText: {
    flex: 1,
    marginLeft: 10,
  },

  advisoryTitle: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 20,
  },

  advisoryDescription: {
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 3,
    fontSize: 14,
  },

  customSection: {
    marginBottom: Spacing.lg,
  },

  section: {
    marginBottom: Spacing.lg,
  },

  sectionTitle: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 20,
  },

  sectionHeader: {
    alignSelf: "flex-start",
    marginTop: 3,
    marginBottom: Spacing.md,
  },

  sectionLine: {
    width: "100%",
    height: 3,
    borderRadius: 2,
    marginTop: 2,
  },

  // Loading/empty state card for the custom section. Matches
  // the custom appliance box outer height (boxCustom 234) so
  // both share one silhouette, plus breathing room before the
  // next section header (stacks with the section margin).
  customState: {
    minHeight: 234,
    marginBottom: Spacing.md,
  },

  customButton: {
    minHeight: Control.button,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: colors.primary,
    borderRadius: Radius.md,
  },

  customButtonText: {
    color: colors.onPrimary,
    fontWeight: "700",
    fontSize: 14,
  },

  grid: applianceCardGrid,

  searchRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },

  searchBoxFlex: {
    flex: 1,
  },

  archiveButton: {
    width: Field.height,
    height: Field.height,
    minWidth: Touch.target,
    minHeight: Touch.target,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.md,
    backgroundColor: colors.primary,
    marginBottom: 18,
  },

  noResults: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 35,
    gap: 8,
  },

  noResultsText: {
    color: colors.textSecondary,
    textAlign: "center",
  },

  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.headerBackground,
    backgroundColor: colors.headerBackground,
  },

  selectedInfo: {
    minHeight: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginBottom: 8,
  },

  selectedGroup: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  selectedText: {
    color: colors.headerContent,
    fontSize: 14,
  },

  footerButtons: {
    flexDirection: "row",
    gap: 8,
  },

  resetButton: {
    flex: 1,
    minHeight: Control.button,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.md,
    backgroundColor: colors.primarySoft,
  },

  resetText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 14,
  },

  actionButton: {
    flex: 1,
    minHeight: Control.button,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.md,
    backgroundColor: colors.primarySoft,
  },

  actionText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 14,
  },

  pressed: {
    opacity: 0.7,
  },

  buttonPressed: {
    backgroundColor: colors.glass.whiteStrong,
    opacity: 1,
  },

  successPanel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: Spacing.md,
  },

  successText: {
    flex: 1,
    color: colors.accentContent,
    fontWeight: "600",
  },
});