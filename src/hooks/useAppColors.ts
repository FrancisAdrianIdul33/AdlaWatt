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
// ============================================================

export function useAppColors() {
  const { theme } = useTheme();

  return useMemo(
    () => ({
      ...(theme === "dark"
        ? Colors.dark
        : Colors.light),
      glass:
        theme === "dark"
          ? Colors.glassDark
          : Colors.glass,
    }),
    [theme],
  );
}

export type AppColors = ReturnType<
  typeof useAppColors
>;
