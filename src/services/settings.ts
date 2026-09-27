import AsyncStorage from "@react-native-async-storage/async-storage";

import type {
  FontFamilyOption,
  FontSizeOption,
} from "@/services/typography";

// ============================================================
// TYPOGRAPHY PREFERENCES (v1)
//
// Local-only system settings. No Supabase.
// Dark mode / color blind mode are intentionally excluded.
// Language / vibration / email alerts are reserved for later
// and can extend this interface without migration breaks.
// ============================================================

export interface TypographyPreferences {
  fontSize: FontSizeOption;
  fontFamily: FontFamilyOption;
}

export const DEFAULT_TYPOGRAPHY: TypographyPreferences =
  {
    fontSize: "Medium",
    fontFamily: "System Default",
  };

export const TYPOGRAPHY_STORAGE_KEY =
  "adlawatt.typography.v1";

function sanitize(
  value: unknown,
): TypographyPreferences {
  const candidate =
    (value as Partial<TypographyPreferences>) ??
    {};

  const fontSize: FontSizeOption =
    candidate.fontSize === "Small" ||
    candidate.fontSize === "Big"
      ? candidate.fontSize
      : "Medium";

  const fontFamily: FontFamilyOption =
    candidate.fontFamily === "Times New Roman" ||
    candidate.fontFamily === "Roboto" ||
    candidate.fontFamily === "Inter" ||
    candidate.fontFamily === "Monospace"
      ? candidate.fontFamily
      : "System Default";

  // Old saves may still carry fontWeight: ignored (no migration).

  return {
    fontSize,
    fontFamily,
  };
}

export async function loadTypographyPreferences(): Promise<TypographyPreferences> {
  try {
    const raw = await AsyncStorage.getItem(
      TYPOGRAPHY_STORAGE_KEY,
    );

    if (!raw) {
      return DEFAULT_TYPOGRAPHY;
    }

    return sanitize(JSON.parse(raw));
  } catch {
    return DEFAULT_TYPOGRAPHY;
  }
}

export async function saveTypographyPreferences(
  prefs: TypographyPreferences,
): Promise<void> {
  // Best-effort: callers already hold the new prefs in
  // state, so a blocked store (e.g. web private mode)
  // must not break Save.
  try {
    await AsyncStorage.setItem(
      TYPOGRAPHY_STORAGE_KEY,
      JSON.stringify(sanitize(prefs)),
    );
  } catch {
    // Intentionally ignored.
  }
}
