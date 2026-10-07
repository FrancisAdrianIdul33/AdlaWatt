// ============================================================
// APPLIANCE CATALOG (code copy of SQL §7 inserts)
// ============================================================
//
// Single source for predefined appliances. Readers
// (ApplianceModal, appliances screen, recommendations,
// notifications) import from here — never from a component
// file. Display stays "min-maxW" to keep parseWattageRange +
// validators working. Keys are namespaced catalog: and must
// never be renamed after release (DB rows reference them).
// ============================================================

export type CatalogItem = {
  key: string;
  name: string;
  wattMin: number;
  wattMax: number;
  display: string;
  uiArea: string;
};

export const catalogDisplay = (
  min: number,
  max: number,
): string => `${min}-${max}W`;

export const GIVEN_CATALOG: CatalogItem[] = [
  // Living Area
  { key: "catalog:living:stand-fan", name: "Stand Fan / Desk Fan", wattMin: 35, wattMax: 75, display: catalogDisplay(35, 75), uiArea: "Living Area" },
  { key: "catalog:living:led-tv", name: '32" to 43" LED Smart TV', wattMin: 30, wattMax: 80, display: catalogDisplay(30, 80), uiArea: "Living Area" },
  { key: "catalog:living:router", name: "Wi-Fi Router / Fiber Modem", wattMin: 10, wattMax: 20, display: catalogDisplay(10, 20), uiArea: "Living Area" },
  { key: "catalog:living:tv-box", name: "Digital TV Box", wattMin: 5, wattMax: 15, display: catalogDisplay(5, 15), uiArea: "Living Area" },
  { key: "catalog:living:speaker", name: "Portable Bluetooth Speaker / Mini Soundbar", wattMin: 10, wattMax: 50, display: catalogDisplay(10, 50), uiArea: "Living Area" },
  { key: "catalog:living:bulb", name: "LED Bulb / Ceiling Light", wattMin: 7, wattMax: 15, display: catalogDisplay(7, 15), uiArea: "Living Area" },
  // Bedroom
  { key: "catalog:bedroom:wall-fan", name: "Wall Fan / Clip Fan", wattMin: 25, wattMax: 50, display: catalogDisplay(25, 50), uiArea: "Bedroom" },
  { key: "catalog:bedroom:phone-charger", name: "Smartphone Fast Charger", wattMin: 10, wattMax: 33, display: catalogDisplay(10, 33), uiArea: "Bedroom" },
  { key: "catalog:bedroom:tablet-charger", name: "Tablet Charger", wattMin: 10, wattMax: 20, display: catalogDisplay(10, 20), uiArea: "Bedroom" },
  { key: "catalog:bedroom:emergency-light", name: "Rechargeable Emergency Light / Flashlight", wattMin: 5, wattMax: 15, display: catalogDisplay(5, 15), uiArea: "Bedroom" },
  { key: "catalog:bedroom:swatter", name: "Electric Mosquito Swatter / Insect Trap", wattMin: 2, wattMax: 5, display: catalogDisplay(2, 5), uiArea: "Bedroom" },
  { key: "catalog:bedroom:night-light", name: "LED Night Light", wattMin: 3, wattMax: 9, display: catalogDisplay(3, 9), uiArea: "Bedroom" },
  // Kitchen Area
  { key: "catalog:kitchen:refrigerator", name: "Single Door / Small Inverter Refrigerator", wattMin: 60, wattMax: 120, display: catalogDisplay(60, 120), uiArea: "Kitchen Area" },
  { key: "catalog:kitchen:rice-cooker", name: "Small Rice Cooker", wattMin: 300, wattMax: 500, display: catalogDisplay(300, 500), uiArea: "Kitchen Area" },
  { key: "catalog:kitchen:dispenser", name: "Tabletop Water Dispenser", wattMin: 50, wattMax: 80, display: catalogDisplay(50, 80), uiArea: "Kitchen Area" },
  { key: "catalog:kitchen:blender", name: "Basic Kitchen Blender", wattMin: 200, wattMax: 350, display: catalogDisplay(200, 350), uiArea: "Kitchen Area" },
  { key: "catalog:kitchen:multi-cooker", name: "Mini Electric Multi-Cooker / Pot", wattMin: 300, wattMax: 500, display: catalogDisplay(300, 500), uiArea: "Kitchen Area" },
  { key: "catalog:kitchen:exhaust-fan", name: "Exhaust Fan", wattMin: 20, wattMax: 45, display: catalogDisplay(20, 45), uiArea: "Kitchen Area" },
  { key: "catalog:kitchen:bulb", name: "LED Light Bulb", wattMin: 9, wattMax: 18, display: catalogDisplay(9, 18), uiArea: "Kitchen Area" },
  // Work/Study Area
  { key: "catalog:work:laptop-adapter", name: "Laptop Power Adapter", wattMin: 45, wattMax: 65, display: catalogDisplay(45, 65), uiArea: "Work/Study Area" },
  { key: "catalog:work:usb-fan", name: "Mini USB / Desk Fan", wattMin: 5, wattMax: 20, display: catalogDisplay(5, 20), uiArea: "Work/Study Area" },
  { key: "catalog:work:desk-lamp", name: "LED Study Desk Lamp", wattMin: 5, wattMax: 12, display: catalogDisplay(5, 12), uiArea: "Work/Study Area" },
  { key: "catalog:work:printer", name: "Basic Inkjet Printer", wattMin: 10, wattMax: 30, display: catalogDisplay(10, 30), uiArea: "Work/Study Area" },
  // Bathroom Area
  { key: "catalog:bath:washing-machine", name: "Twin-Tub / Single-Tub Washing Machine", wattMin: 150, wattMax: 350, display: catalogDisplay(150, 350), uiArea: "Bathroom Area" },
  { key: "catalog:bath:clipper", name: "Rechargeable Hair Clipper / Trimmer", wattMin: 5, wattMax: 10, display: catalogDisplay(5, 10), uiArea: "Bathroom Area" },
  { key: "catalog:bath:bulb", name: "Bathroom LED Bulb", wattMin: 5, wattMax: 12, display: catalogDisplay(5, 12), uiArea: "Bathroom Area" },
  { key: "catalog:bath:exhaust-fan", name: "Small Exhaust Fan", wattMin: 15, wattMax: 30, display: catalogDisplay(15, 30), uiArea: "Bathroom Area" },
  // Porch
  { key: "catalog:porch:bulb", name: "Outdoor Porch LED Bulb", wattMin: 10, wattMax: 20, display: catalogDisplay(10, 20), uiArea: "Porch" },
  { key: "catalog:porch:cctv", name: "Home CCTV Camera System", wattMin: 5, wattMax: 12, display: catalogDisplay(5, 12), uiArea: "Porch" },
];

export const CATALOG_BY_KEY = new Map(
  GIVEN_CATALOG.map((item) => [item.key, item]),
);

export const CATALOG_BY_NAME = new Map(
  GIVEN_CATALOG.map((item) => [
    item.name.trim().toLowerCase(),
    item,
  ]),
);

export const CUSTOM_AREA = "Custom Appliances";

export type ApplianceLevel = "low" | "moderate" | "high";

// Same thresholds the old DB trigger used.
export const levelFromWatts = (
  watts: number,
): ApplianceLevel =>
  watts <= 240 ? "low" : watts <= 480 ? "moderate" : "high";

// DB row shape — v5: user picks only.
//   given  = { catalog_key LIKE 'catalog:%', wattage_min/max }
//   custom = { catalog_key NULL, wattage_min/max interval }
// Catalog wattage/area always come from GIVEN_CATALOG in code.
export type ApplianceRow = {
  app_id: string;
  appliance_name: string;
  type?: string | null;
  catalog_key?: string | null;
  wattage_min?: number | string | null;
  wattage_max?: number | string | null;
  selection?: boolean | null;
  archive?: boolean | null;
  user_id?: string | null;
  image_url?: string | null;
};

// One shape for every reader.
export type ResolvedAppliance = {
  id: string;
  name: string;
  source: "catalog" | "custom";
  wattMin: number;
  wattMax: number;
  display: string;
  area: string;
  level: ApplianceLevel;
  selected: boolean;
  appId?: string | null;
  // Stored public photo URL (custom rows only). Absent =
  // bundled adlawatt icon, the default everywhere.
  imageUrl?: string | null;
};

// Turns a DB row into a ResolvedAppliance. Returns null
// when a given row references a catalog key that no longer
// exists in code (do not rename keys after release), or when
// a custom row has no valid wattage_min/max pair.
export function resolveRow(
  row: ApplianceRow,
): ResolvedAppliance | null {
  const catalogKey =
    row.catalog_key?.trim() || null;

  if (row.type === "given" || catalogKey) {
    const byKey = catalogKey
      ? CATALOG_BY_KEY.get(catalogKey)
      : undefined;
    const byName = CATALOG_BY_NAME.get(
      row.appliance_name.trim().toLowerCase(),
    );
    const item = byKey ?? byName;

    if (!item) {
      return null;
    }

    return {
      id: item.key,
      name: item.name,
      source: "catalog",
      wattMin: item.wattMin,
      wattMax: item.wattMax,
      display: item.display,
      area: item.uiArea,
      level: levelFromWatts(item.wattMax),
      selected: row.selection ?? true,
      appId: row.app_id ?? null,
    };
  }

  // Custom v5: wattage_min/max interval only.
  // numeric(6,2) may arrive as string via PostgREST.
  const colMinRaw = Number(row.wattage_min);
  const colMaxRaw = Number(row.wattage_max);
  const colMin =
    Number.isFinite(colMinRaw) && colMinRaw > 0
      ? colMinRaw
      : null;
  const colMax =
    Number.isFinite(colMaxRaw) && colMaxRaw > 0
      ? colMaxRaw
      : null;

  if (
    colMin === null ||
    colMax === null ||
    colMax < colMin
  ) {
    return null;
  }

  return {
    id: String(row.app_id),
    name: row.appliance_name,
    source: "custom",
    wattMin: colMin,
    wattMax: colMax,
    display: catalogDisplay(colMin, colMax),
    area: CUSTOM_AREA,
    level: levelFromWatts(colMax),
    selected: row.selection ?? false,
    appId: row.app_id ?? null,
    imageUrl:
      typeof row.image_url === "string"
        ? row.image_url
        : null,
  };
}

// ============================================================
// BUNDLED CATALOG PHOTOS (Living Area batch)
// ============================================================
//
// Keys match GIVEN_CATALOG keys; require() paths must be
// static for the bundler. Items without an entry render the
// default adlawatt icon. Resolved items carry the catalog
// key as id, so every surface looks photos up the same way:
// custom uploads first, then this map, then the default.

export const CATALOG_IMAGES: Record<string, number> = {
  "catalog:living:stand-fan": require("@/assets/images/appliances/stand-fan.png"),
  "catalog:living:led-tv": require("@/assets/images/appliances/led-tv.png"),
  "catalog:living:router": require("@/assets/images/appliances/router.png"),
  "catalog:living:tv-box": require("@/assets/images/appliances/tv-box.png"),
  "catalog:living:speaker": require("@/assets/images/appliances/speaker.png"),
  "catalog:living:bulb": require("@/assets/images/appliances/bulb.png"),
  // Bedroom batch (charger photo shared by phone + tablet keys)
  "catalog:bedroom:wall-fan": require("@/assets/images/appliances/clip-fan.png"),
  "catalog:bedroom:phone-charger": require("@/assets/images/appliances/charger.png"),
  "catalog:bedroom:tablet-charger": require("@/assets/images/appliances/charger.png"),
  "catalog:bedroom:emergency-light": require("@/assets/images/appliances/emergency-light.png"),
  "catalog:bedroom:swatter": require("@/assets/images/appliances/swatter.png"),
  "catalog:bedroom:night-light": require("@/assets/images/appliances/night-light.png"),
};
