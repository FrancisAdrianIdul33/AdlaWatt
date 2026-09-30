import { Slot } from "expo-router";
import { LogBox } from "react-native";

import { AuthProvider } from "@/context/AuthContext";

// Benign web-only responder noise ("Cannot record touch end
// without a touch start", empty Touch Bank) fires without user
// interaction on localhost and doesn't block taps. Filter it
// from the dev overlay while keeping all other warnings.
LogBox.ignoreLogs([
  "Cannot record touch end without a touch start",
]);

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
