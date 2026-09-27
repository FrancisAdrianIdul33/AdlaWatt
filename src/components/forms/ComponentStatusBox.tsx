import React from "react";
import {
  Image,
  ImageSourcePropType,
  View,
} from "react-native";

import {
  useApplianceCardStyles,
} from "@/components/forms/applianceCard";
import AppText from "@/components/ui/AppText";
import { useAppColors } from "@/hooks/useAppColors";

type ComponentStatus =
  | "Active"
  | "Inactive"
  | "Connected"
  | "Not Connected";

type ComponentStatusBoxProps = {
  name: string;
  status: ComponentStatus;
  imageSource?: ImageSourcePropType;
};

const defaultImage = require("@/assets/images/components/toph.jpg");

export default function ComponentStatusBox({
  name,
  status,
  imageSource = defaultImage,
}: ComponentStatusBoxProps) {
  const colors = useAppColors();
  const isActive =
    status === "Active" || status === "Connected";

  const statusColor = isActive
    ? colors.primary
    : colors.error;

  const applianceCardStyles =
    useApplianceCardStyles();

  return (
    <View
      style={[
        applianceCardStyles.boxSlim,
        {
          borderColor: statusColor,
        },
      ]}
    >
      {/* Component Image */}
      <View
        style={[
          applianceCardStyles.imageContainer,
          {
            borderColor: statusColor,
          },
        ]}
      >
        <Image
          source={imageSource}
          style={applianceCardStyles.image}
          resizeMode="cover"
        />
      </View>

      {/* Component Name */}
      <AppText
        variant="caption"
        style={applianceCardStyles.name}
        numberOfLines={2}
      >
        {name}
      </AppText>
    </View>
  );
}