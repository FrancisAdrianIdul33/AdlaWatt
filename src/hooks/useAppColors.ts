import { useMemo } from "react";

import { Colors } from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";

// ============================================================
// APP COLORS HOOK
//
// Returns the active theme palette from colors.ts. Migration
// rule: `Colors.light.X` -> `colors.X` (and `Colors.glass.Y`
// -> `colors.glass.Y`) so every screen re-renders on theme
// change. Frozen records (areas, severity, weather) are
// shared by reference across themes and need no branching.
// "system" resolves via ThemeContext to light/dark, so auth
// screens (no provider) stay light and dashboard follows the
// OS by default with manual override.
// ============================================================

export function useAppColors() {
  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === "dark";

  return useMemo(
    () => ({
      ...(isDark
        ? Colors.dark
        : Colors.light),
      glass:
        isDark
          ? Colors.glassDark
          : Colors.glass,
      isDark,
      resolvedTheme,
    }),
    [isDark, resolvedTheme],
  );
}

export type AppColors = ReturnType<
  typeof useAppColors
>;
