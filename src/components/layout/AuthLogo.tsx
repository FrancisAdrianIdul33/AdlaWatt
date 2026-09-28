import React from "react";
import { useWindowDimensions } from "react-native";

import AppLogo from "@/components/ui/AppLogo";

// ============================================================
// AUTH LOGO
//
// Single shared logo for login + register. Width is 50% of
// the viewport width, clamped so small phones stay legible
// and tablets / web don't blow up. Height follows the logo
// aspect ratio. Rendered as the first child of the scroll
// content on both screens, so it scrolls away with the form
// and sits in an identical position on login + register.
// ============================================================

const LOGO_RATIO = 0.5;
const LOGO_MIN = 160;
const LOGO_MAX = 240;
const LOGO_ASPECT = 0.55;

export default function AuthLogo() {
  const { width } = useWindowDimensions();

  const logoWidth = Math.min(
    Math.max(width * LOGO_RATIO, LOGO_MIN),
    LOGO_MAX,
  );

  return (
    <AppLogo
      width={logoWidth}
      height={logoWidth * LOGO_ASPECT}
    />
  );
}
