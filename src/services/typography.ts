import { Platform } from "react-native";

// ============================================================
// TYPOGRAPHY OPTIONS
//
// The 5 font labels shown in Preferences. They resolve to
// real loaded fonts (Inter / Roboto via expo-font) or to
// platform system stacks for the rest.
// ============================================================

export type FontSizeOption =
  | "Small"
  | "Medium"
  | "Big";

export type FontFamilyOption =
  | "Times New Roman"
  | "Roboto"
  | "Inter"
  | "System Default"
  | "Monospace";

export const FONT_FAMILY_OPTIONS: FontFamilyOption[] =
  [
    "Inter",
    "Times New Roman",
    "Roboto",
    "Monospace",
    "System Default",
  ];

export const FONT_SIZE_OPTIONS: FontSizeOption[] =
  ["Small", "Medium", "Big"];

// ============================================================
// SIZE SCALE
// ============================================================

const FONT_SCALES: Record<
  FontSizeOption,
  number
> = {
  Small: 0.875,
  Medium: 1,
  Big: 1.15,
};

export function getFontScale(
  size: FontSizeOption,
): number {
  return FONT_SCALES[size] ?? 1;
}

// ============================================================
// FAMILY RESOLUTION
//
// Design weights select the bundled file: Inter / Roboto
// ship Light / Regular / Bold files, so a 700 design uses
// the real Bold file instead of synthesizing. Never pair a
// bundled file with a fontWeight style (Android drops the
// custom font and falls back to system in that case).
// Times New Roman cannot be bundled (proprietary license)
// so it resolves to the platform serif stack.
// System Default resolves to undefined (platform default).
// ============================================================

export type DesignWeight =
  | "300"
  | "400"
  | "600"
  | "700"
  | "normal"
  | "bold";

function bundledFile(
  base: "Inter" | "Roboto",
  designWeight: DesignWeight,
): string {
  const bold =
    designWeight === "700" ||
    designWeight === "600" ||
    designWeight === "bold";

  if (bold) {
    return `${base}_700Bold`;
  }

  if (designWeight === "300") {
    return `${base}_300Light`;
  }

  return `${base}_400Regular`;
}

export function getFontFamilyName(
  family: FontFamilyOption,
  designWeight: DesignWeight = "400",
): string | undefined {
  if (family === "System Default") {
    return undefined;
  }

  if (family === "Inter") {
    return bundledFile("Inter", designWeight);
  }

  if (family === "Roboto") {
    return bundledFile("Roboto", designWeight);
  }

  if (family === "Times New Roman") {
    return Platform.select({
      ios: "Georgia",
      android: "serif",
      web: "Georgia",
      default: "serif",
    });
  }

  if (family === "Monospace") {
    return Platform.select({
      ios: "Menlo",
      android: "monospace",
      web: "monospace",
      default: "monospace",
    });
  }

  return undefined;
}

// ============================================================
// WEIGHT STYLE GATE
//
// Bundled Inter / Roboto files already encode the design
// weight, so no fontWeight style may accompany them.
// System stacks need the design weight to render bold/light.
// ============================================================

export function shouldApplyFontWeight(
  family: FontFamilyOption,
): boolean {
  return (
    family !== "Inter" &&
    family !== "Roboto"
  );
}
