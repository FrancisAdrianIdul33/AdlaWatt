import AsyncStorage from "@react-native-async-storage/async-storage";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme } from "react-native";

import type {
  ResolvedTheme,
  ThemeOption,
} from "@/constants/colors";

// ============================================================
// THEME CONTEXT (light / dark / system v2)
//
// Local-only. Single shared instance for the dashboard via
// app/dashboard/_layout (same scoping as typography: auth
// screens are excluded and always render light).
//
// Preference is staged in Menu (Save draft): the selector only
// updates local draft state, Save commits via setTheme.
// "system" (default) follows the OS color scheme; manual
// light/dark overrides it. v1 keys ("light"/"dark" only)
// migrate forward on first load.
// ============================================================

export const THEME_STORAGE_KEY =
  "adlawatt.theme.v2";

const LEGACY_THEME_STORAGE_KEY =
  "adlawatt.theme.v1";

export const DEFAULT_THEME: ThemeOption =
  "system";

function sanitize(
  value: unknown,
): ThemeOption {
  if (
    value === "dark" ||
    value === "light" ||
    value === "system"
  ) {
    return value;
  }

  return DEFAULT_THEME;
}

function parseStored(
  raw: string | null,
): ThemeOption | null {
  if (!raw) {
    return null;
  }

  try {
    return sanitize(JSON.parse(raw));
  } catch {
    // Very old builds stored the bare string.
    return sanitize(raw);
  }
}

interface ThemeContextValue {
  /** Persisted preference (may be "system"). */
  theme: ThemeOption;
  /** Actual applied theme after OS resolution. */
  resolvedTheme: ResolvedTheme;
  isDark: boolean;
  isLoaded: boolean;
  setTheme: (
    theme: ThemeOption,
  ) => Promise<void>;
}

const ThemeContext =
  createContext<ThemeContextValue | null>(
    null,
  );

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const systemScheme = useColorScheme();

  const [theme, setThemeState] =
    useState<ThemeOption>(DEFAULT_THEME);

  const [isLoaded, setIsLoaded] =
    useState(false);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const raw =
          await AsyncStorage.getItem(
            THEME_STORAGE_KEY,
          );

        let next =
          parseStored(raw);

        // Migrate v1 ("light"/"dark" only) forward once.
        if (!next) {
          const legacy =
            await AsyncStorage.getItem(
              LEGACY_THEME_STORAGE_KEY,
            );

          next = parseStored(legacy);

          if (next && next !== "system") {
            try {
              await AsyncStorage.setItem(
                THEME_STORAGE_KEY,
                JSON.stringify(next),
              );
            } catch {
              // Best-effort migration write.
            }
          }
        }

        if (active) {
          setThemeState(
            next ?? DEFAULT_THEME,
          );
          setIsLoaded(true);
        }
      } catch {
        if (active) {
          setIsLoaded(true);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const setTheme = useCallback(
    async (next: ThemeOption) => {
      // State first so the UI (including web) flips even if
      // storage is unavailable (blocked localStorage, etc.).
      setThemeState(next);

      try {
        await AsyncStorage.setItem(
          THEME_STORAGE_KEY,
          JSON.stringify(next),
        );
      } catch {
        // Best-effort persistence: theme still applies
        // for this session.
      }
    },
    [],
  );

  const resolvedTheme: ResolvedTheme =
    theme === "system"
      ? systemScheme === "dark"
        ? "dark"
        : "light"
      : theme;

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      isDark: resolvedTheme === "dark",
      isLoaded,
      setTheme,
    }),
    [theme, resolvedTheme, isLoaded, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);

  if (ctx) {
    return ctx;
  }

  // Fallback outside provider (auth screens, tests):
  // always light, writes are no-ops.
  return {
    theme: DEFAULT_THEME,
    resolvedTheme: "light",
    isDark: false,
    setTheme: async () => {},
    isLoaded: false,
  };
}
