import React, { useMemo } from "react";
import Svg, { Path } from "react-native-svg";

interface GoogleGIconProps {
  size?: number;
}

// ============================================================
// GOOGLE G ICON
// ============================================================
//
// Official multicolor "G" mark (Blue #4285F4, Green #34A853,
// Yellow #FBBC05, Red #EA4335) drawn with react-native-svg so
// it stays crisp in light/dark mode without image assets.
// Replaces the generic Ionicons logo-google glyph on the
// Continue with Google button (recognition over recall).
// ============================================================

export default function GoogleGIcon({
  size = 20,
}: GoogleGIconProps) {
  const dimension = useMemo(
    () => Math.max(16, size),
    [size],
  );

  return (
    <Svg
      width={dimension}
      height={dimension}
      viewBox="0 0 24 24"
      accessibilityRole="image"
      accessibilityLabel="Google logo"
    >
      <Path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <Path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <Path
        fill="#FBBC05"
        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
      />
      <Path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </Svg>
  );
}
