import AsyncStorage from "@react-native-async-storage/async-storage";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { ThemeOption } from "@/constants/colors";

// ============================================================
// THEME CONTEXT (light / dark v1)
//
// Local-only. Single shared instance for the dashboard via
// app/dashboard/_layout (same scoping as typography: auth
// screens are excluded and always render light).
// Instant-apply: the Preferences toggle writes through
// immediately instead of joining the typography Save draft.
// ============================================================

export const THEME_STORAGE_KEY =
  "adlawatt.theme.v1";

export const DEFAULT_THEME: ThemeOption =
  "light";

function sanitize(
  value: unknown,
): ThemeOption {
  return value === "dark"
    ? "dark"
    : "light";
}

interface ThemeContextValue {
  theme: ThemeOption;
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
  const [theme, setThemeState] =
    useState<ThemeOption>(DEFAULT_THEME);

  const [isLoaded, setIsLoaded] =
    useState(false);

  useEffect(() => {
    let active = true;

    try {
      AsyncStorage.getItem(THEME_STORAGE_KEY)
        .then((raw) => {
          if (active) {
            setThemeState(
              sanitize(
                raw ? JSON.parse(raw) : null,
              ),
            );
            setIsLoaded(true);
          }
        })
        .catch(() => {
          if (active) {
            setIsLoaded(true);
          }
        });
    } catch {
      setIsLoaded(true);
    }

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

  const value = useMemo(
    () => ({
      theme,
      isLoaded,
      setTheme,
    }),
    [theme, isLoaded, setTheme],
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
    isLoaded: false,
    setTheme: async () => {},
  };
}
