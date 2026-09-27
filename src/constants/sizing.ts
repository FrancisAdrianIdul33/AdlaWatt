import { useWindowDimensions } from "react-native";

// ============================================================
// SIZING SYSTEM (v1)
//
// Single source of truth for component dimensions, touch
// targets, and responsive screen padding. All sizes are
// React Native logical pixels (1dp ~= 1pt ~= 1px).
//
// Standard: 48x48 minimum touch target (Android 48dp /
// Apple 44pt / WCAG 2.2 SC 2.5.8 floor 24px). A visible icon
// may be smaller, but its pressable area must reach 48.
// Minimum text size: 12. No colors, branding, or themes here.
// ============================================================

export const Touch = {
  /** Minimum pressable area for any interactive control. */
  target: 48,
  /** Visible icon inside a 48 target. */
  icon: 24,
  /** Compact visible icon (wrapper stays 48). */
  iconCompact: 20,
  /** Inline status icon (non-interactive). */
  iconInline: 16,
} as const;

export const Control = {
  /** Standard button height. */
  button: 48,
  /** Large primary action height. */
  buttonLarge: 56,
  /** Compact button visible height (touch area stays 48). */
  buttonCompact: 40,
  /** Button horizontal padding. */
  buttonPadding: 18,
  /** Button large horizontal padding. */
  buttonLargePadding: 20,
  /** Gap between adjacent buttons. */
  buttonGap: 12,
  /** Gap above a major action button. */
  buttonGapAbove: 16,
} as const;

export const Field = {
  /** Recommended single-line / dropdown trigger height. */
  height: 56,
  /** Minimum single-line field height. */
  minHeight: 52,
  /** Horizontal internal padding. */
  padding: 16,
  /** Input text size (never below 16 for typed fields). */
  textSize: 16,
  /** Label-to-field gap. */
  labelGap: 8,
  /** Field-to-helper/error gap. */
  helperGap: 6,
  /** Field-to-next-field gap. */
  fieldGap: 16,
} as const;

export const OptionRow = {
  /** Minimum select / option / list-action row height. */
  minHeight: 48,
  /** Recommended option row height. */
  height: 52,
  /** Option horizontal padding. */
  padding: 16,
} as const;

export const Bar = {
  /** Top app bar height (plus device safe-area inset). */
  appBar: 56,
  /** Bottom nav height excluding safe area. */
  bottomNav: 64,
  /** Bottom nav icon size. */
  bottomNavIcon: 24,
  /** Sticky action container height range. */
  stickyMin: 64,
  stickyMax: 80,
} as const;

export const Card = {
  /** Standard card padding. */
  padding: 16,
  /** High-priority / result card padding. */
  paddingLarge: 20,
  /** Compact card padding (dense secondary content). */
  paddingCompact: 12,
  /** Gap between cards. */
  gap: 16,
} as const;

export const Type = {
  /** Minimum text size anywhere. */
  min: 12,
  /** Body / input text baseline. */
  body: 16,
  /** Helper / metadata text. */
  compact: 14,
  /** Timestamps / secondary labels. */
  caption: 12,
} as const;

export const Sheet = {
  /** Modal column max width on phones/tablets. */
  maxWidth: 430,
  /** Modal padding. */
  padding: 20,
} as const;

// ============================================================
// RESPONSIVE SCREEN PADDING
//
// Small mobile 320-359: 16 | Standard 360-430: 20
// Large mobile 431-480: 24 | Tablet 481+: 32
// ============================================================

export function getScreenPadding(width: number): number {
  if (width >= 481) {
    return 32;
  }

  if (width >= 431) {
    return 24;
  }

  if (width >= 360) {
    return 20;
  }

  return 16;
}

export function useScreenPadding(): number {
  const { width } = useWindowDimensions();

  return getScreenPadding(width);
}
