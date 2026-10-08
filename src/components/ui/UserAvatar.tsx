import { Image } from "expo-image";
import React, { useState } from "react";
import {
  StyleSheet,
  View,
} from "react-native";

import AppText from "@/components/ui/AppText";
import { useAppColors } from "@/hooks/useAppColors";
import { avatarInitialForName } from "@/services/avatar";

// ============================================================
// USER AVATAR
// ============================================================
//
// Navbar profile circle: Google photo when a URL resolves,
// initial-letter fallback otherwise (email accounts, offline
// image failure, denied loads). Photo failures flip to the
// initial via onError, so a broken image icon can never
// render. Display-only: no press handling, matching the
// username slot it sits beside.
// ============================================================

interface UserAvatarProps {
  username: string;
  photoUrl: string | null;
  size?: number;
}

export default function UserAvatar({
  username,
  photoUrl,
  size = 30,
}: UserAvatarProps) {
  const colors = useAppColors();

  const [failed, setFailed] = useState(false);

  const showPhoto =
    photoUrl !== null && !failed;

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: colors.bar.text,
          backgroundColor: showPhoto
            ? "transparent"
            : colors.primary,
        },
      ]}
      accessibilityRole="image"
      accessibilityLabel={`Profile photo for ${username}`}
    >
      {showPhoto ? (
        <Image
          source={{ uri: photoUrl }}
          style={[
            styles.image,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
          contentFit="cover"
          cachePolicy="memory-disk"
          onError={() => setFailed(true)}
        />
      ) : (
        <AppText
          variant="button"
          style={[
            styles.initial,
            {
              color: colors.onPrimary,
              fontSize: Math.max(
                12,
                Math.round(size * 0.45),
              ),
            },
          ]}
        >
          {avatarInitialForName(username)}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  image: {},

  initial: {
    fontWeight: "700",
  },
});
