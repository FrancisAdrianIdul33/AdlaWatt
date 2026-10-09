import type { User } from "@supabase/supabase-js";

// ============================================================
// AVATAR RESOLUTION (Google photo or nothing)
// ============================================================
//
// Single source for "the user's email profile picture":
// Google sign-ins carry avatar_url (fallback: picture) in
// user_metadata. Email/password accounts carry nothing —
// callers render the initial-letter fallback instead.
//
// Pure and total: every input maps to a URL or null, so it
// is unit-tested directly and the UI never branches on
// auth provider.
// ============================================================

export const resolveAvatarPhotoUrl = (
  user: Pick<
    User,
    "user_metadata"
  > | null,
): string | null => {
  const metadata =
    user?.user_metadata ?? null;

  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const record = metadata as Record<
    string,
    unknown
  >;

  for (const key of [
    "avatar_url",
    "picture",
  ]) {
    const value = record[key];

    if (
      typeof value === "string" &&
      value.trim().length > 0
    ) {
      return value.trim();
    }
  }

  return null;
};

// First alphanumeric of the display name, uppercased.
// Empty/blank names fall back to "?" so the circle is never
// blank (a11y label still carries the full signed-in text).
export const avatarInitialForName = (
  name: string | null,
): string => {
  if (!name) {
    return "?";
  }

  const match = name.match(/[A-Za-z0-9]/);

  return match ? match[0].toUpperCase() : "?";
};
