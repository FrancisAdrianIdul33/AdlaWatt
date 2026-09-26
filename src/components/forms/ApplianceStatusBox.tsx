import { Ionicons } from "@expo/vector-icons";
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
import { Colors } from "@/constants/colors";

type StatusTone =
  | "ok"
  | "care"
  | "not";

type ApplianceStatusBoxProps = {
  name: string;
  wattage: string;
  status: string;
  statusTone?: StatusTone;
  imageSource?: ImageSourcePropType;
};

const defaultImage = require("@/assets/images/adlawatt-icon.png");

export default function ApplianceStatusBox({
  name,
  wattage,
  status,
  statusTone,
  imageSource = defaultImage,
}: ApplianceStatusBoxProps) {
  const tone: StatusTone =
    statusTone ?? (
      status === "OK to use"
        ? "ok"
        : "not"
    );

  const statusColor =
    tone === "care"
      ? Colors.light.warning
      : tone === "not"
        ? Colors.light.error
        : Colors.light.primary;

  const applianceCardStyles =
    useApplianceCardStyles();

  const iconName =
    tone === "ok"
      ? "checkmark"
      : tone === "care"
        ? "warning"
        : "close";

  return (
    <View
      style={[
        applianceCardStyles.box,
        { borderColor: statusColor },
      ]}
    >
      {/* Appliance Image */}
      <View
        style={[
          applianceCardStyles.imageContainer,
          { borderColor: statusColor },
        ]}
      >
        <Image
          source={imageSource}
          style={applianceCardStyles.image}
          resizeMode="cover"
        />
      </View>

      {/* Appliance Name */}
      <AppText
        variant="caption"
        style={applianceCardStyles.name}
        numberOfLines={2}
      >
        {name}
      </AppText>

      {/* Wattage */}
      <AppText
        variant="caption"
        style={applianceCardStyles.watts}
      >
        {wattage}
      </AppText>

      {/* Status */}
      <View
        style={[
          applianceCardStyles.status,
          {
            backgroundColor:
              statusColor,
          },
        ]}
      >
        <Ionicons
          name={iconName}
          size={13}
          // Frozen pairing: white on the frozen status fill,
          // identical in both themes.
          color={Colors.light.onPrimary}
        />

        <AppText
          variant="caption"
          style={applianceCardStyles.statusText}
        >
          {status}
        </AppText>
      </View>
    </View>
  );
}