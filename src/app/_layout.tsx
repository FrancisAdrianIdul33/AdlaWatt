import { Slot } from "expo-router";

import { AuthProvider } from "@/context/AuthContext";

// ============================================================
// ROOT LAYOUT
// ============================================================
//
// Single mount point for cross-cutting providers. Session
// state (AuthProvider) lives here so splash, auth screens,
// and dashboard guards share one bootstrap instead of each
// calling getSession() ad hoc. Fonts and theme stay in the
// group layouts (auth renders its fallback theme by design).
// ============================================================

export default function RootLayout() {
  return (
    <AuthProvider>
      <Slot />
    </AuthProvider>
  );
}
