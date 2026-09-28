import { StyleSheet } from "react-native";

import { Control, Touch } from "@/constants/sizing";

// ============================================================
// SEGMENTED CONTROL SHARED SIZES
//
// Single source of sizes for every segmented toggle in the
// app (Toggle, recommendation, frequency, status toggles).
// Sizes only — no colors. Each toggle composes these with
// its own local color/width/radius styles, so metrics can
// never drift between toggles again.
//
// Geometry (exact fit, no waste):
//   shell 58 = 48 segment + 6 padding + 4 border
//   segment 48 = ~40 capsule + 8 air (4 top / 4 bottom)
//   capsule ~= text + 36 sides + 20 vertical (pill hugs text)
// Shell-to-pill distance = 3 pad + 4 air = 7px top/bottom.
//
// Segments stay transparent with a 48px target; only the
// inner capsule carries the active fill.
// ============================================================

export const segmentedSizes = StyleSheet.create({
  shell: {
    minHeight: Control.segmentedShell,
    flexDirection: "row",
    alignItems: "center",
    padding: Control.segmentPad,
    borderWidth: 2,
  },

  segment: {
    flex: 1,
    minHeight: Touch.target,
    alignItems: "center",
    justifyContent: "center",
  },

  capsule: {
    paddingHorizontal: Control.capsulePadH,
    paddingVertical: Control.capsulePadV,
    borderRadius: Control.capsuleRadius,
    alignItems: "center",
    justifyContent: "center",
  },

  label: {
    fontSize: 14,
    fontWeight: "700",
  },
});
