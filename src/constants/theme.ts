import "@/global.css";

import { Platform } from "react-native";

// NOTE: The legacy Colors palette was removed. Single source of
// truth is src/constants/colors.ts consumed via useAppColors().
// This module keeps sizing-adjacent tokens (Fonts, Spacing,
// Radius, Typography) only.
/*
|--------------------------------------------------------------------------
| Fonts
|--------------------------------------------------------------------------
*/

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },

  android: {
    sans: "sans-serif",
    serif: "serif",
    rounded: "sans-serif",
    mono: "monospace",
  },

  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },

  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

/*
|--------------------------------------------------------------------------
| Spacing
|--------------------------------------------------------------------------
*/

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/*
|--------------------------------------------------------------------------
| Border Radius
|--------------------------------------------------------------------------
*/

export const Radius = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
  round: 999,
} as const;

/*
|--------------------------------------------------------------------------
| Typography
|--------------------------------------------------------------------------
*/

export const Typography = {
  display: 36,
  title: 30,
  heading: 24,
  subheading: 20,
  body: 16,
  caption: 14,
  small: 12,
} as const;

/*
|--------------------------------------------------------------------------
| Shadows
|--------------------------------------------------------------------------
*/

export const Shadows = {
  sm: {
    boxShadow: "0px 2px 3px rgba(0,0,0,0.08)",
    elevation: 2,
  },

  md: {
    boxShadow: "0px 3px 6px rgba(0,0,0,0.12)",
    elevation: 4,
  },

  lg: {
    boxShadow: "0px 6px 10px rgba(0,0,0,0.16)",
    elevation: 8,
  },
} as const;