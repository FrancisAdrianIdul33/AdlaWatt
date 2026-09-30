import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    "Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY in .env.local, then restart the dev server.",
  );
}

const storage =
  Platform.OS === "web"
    ? undefined
    : AsyncStorage;

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey,
  {
    auth: {
      ...(storage ? { storage } : {}),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

// ============================================================
// SAFE AUTHENTICATED USER
// ============================================================
//
// Single helper for background / fire-and-forget callers.
//
// getUser() requires a stored session and throws/returns
// AuthSessionMissingError when logged out, on fresh install,
// or before restore completes. That state is expected, so it
// resolves to null silently (console.debug) instead of
// console.error noise like:
//   "Error getting authenticated user: Auth session missing!"
//
// Real failures still log via console.error.
// Always check getSession() first to avoid the network call
// entirely when logged out.
// ============================================================

export const isAuthSessionMissingError = (
  error: unknown,
): boolean => {
  if (!error) {
    return false;
  }

  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof (error as { message: unknown }).message ===
            "string"
        ? (error as { message: string }).message
        : String(error);

  return message.toLowerCase().includes("auth session missing");
};

export const getAuthenticatedUserSafe =
  async (): Promise<User | null> => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        return null;
      }

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        if (isAuthSessionMissingError(error)) {
          console.debug(
            "[auth] no session — skipping authenticated fetch.",
          );
        } else {
          console.error(
            "Error getting authenticated user:",
            error.message,
          );
        }

        return null;
      }

      return user ?? null;
    } catch (error) {
      if (isAuthSessionMissingError(error)) {
        console.debug(
          "[auth] no session — skipping authenticated fetch.",
        );
      } else {
        console.error(
          "Error getting authenticated user:",
          error instanceof Error ? error.message : error,
        );
      }

      return null;
    }
  };