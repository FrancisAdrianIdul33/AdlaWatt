import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import Copyright from "@/components/ui/Copyright";
import NavBar from "@/components/layout/Navbar";
import ScreenContainer2 from "@/components/layout/ScreenContainer2";
import AppText from "@/components/ui/AppText";
import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";

export default function AboutUsScreen() {
  const colors = useAppColors();

  const styles = useMemo(
    () => getStyles(colors),
    [colors],
  );

  return (
    <ScreenContainer2>
      {/* Fixed Navbar */}
      <NavBar />

      {/* Scrollable About Us Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* About Us Header */}
        <View style={styles.headerCard}>
          <AppText
            variant="heading"
            style={styles.headerTitle}
          >
            About Us
          </AppText>

          <AppText
            variant="caption"
            style={styles.headerSubtitle}
          >
            Learn more about AdlaWatt and its purpose.
          </AppText>
        </View>

        {/* AdlaWatt Introduction */}
        <View style={styles.introduction}>
          <AppText
            variant="heading"
            style={styles.adlawattTitle}
          >
            AdlaWatt
          </AppText>

          <AppText
            variant="caption"
            style={styles.adlawattSubtitle}
          >
            An IoT-Based Off-Grid Solar Backup Power
            System with Real-Time Energy Monitoring and
            Appliance Recommendation
          </AppText>

          <AppText
            variant="caption"
            style={styles.overview}
          >
            AdlaWatt is a transportable, off-grid solar
            backup power system designed to provide
            households with an affordable and reliable
            source of electricity during power
            interruptions. The system collects solar
            energy using a solar panel, stores it in a
            battery inside a secure lockable enclosure,
            and supplies backup power to everyday
            appliances through a built-in AC outlet.
            Through real-time sensors and a simple
            mobile application, users can view live
            battery levels, incoming solar power, energy
            consumption, and safety temperatures, while
            receiving smart appliance recommendations
            based on their remaining battery capacity.
            By bringing real-time monitoring and energy
            guidance together, AdlaWatt empowers
            families to easily control their energy usage,
            keep essential devices running safely, and
            maintain power during blackouts.
          </AppText>
        </View>

        {/* Developers */}
        <AppText
          variant="body"
          style={styles.sectionTitle}
        >
          Developers
        </AppText>

        {/* Developer 1 */}
        <DeveloperProfile
          image={require("@/assets/images/developers/d1.jpg")}
          name="Francis Adrian Idul"
          role="Programmer"
          roleColor= {colors.primary}
          description="Develops and maintains software and system firmware, integrating real-time sensor data, including battery levels, solar input, and temperature, into the mobile app and programming recommendation algorithms."
        />

        {/* Developer 2 */}
        <DeveloperProfile
          image={require("@/assets/images/developers/d2.jpg")}
          name="Rhics T. Geonzon"
          role="Documenter"
          roleColor={colors.areas.study}
          description="Authors user manuals, system setup guides, technical documentation, and safety instructions for operating the AdlaWatt hardware and mobile application."
        />

        {/* Developer 3 */}
        <DeveloperProfile
          image={require("@/assets/images/developers/d3.jpg")}
          name="Troy M. Rojo"
          role="Data Analyst"
          roleColor={colors.secondary}
          description="Analyzes incoming sensor telemetry, including solar generation patterns, appliance power consumption, and battery performance, to optimize system efficiency and refine smart appliance recommendations."
        />

        {/* Contact Details */}
        <AppText
          variant="body"
          style={[
            styles.sectionTitle,
            styles.contactTitle,
          ]}
        >
          Contact Details
        </AppText>

        <View style={styles.contactList}>
          {/* Phone */}
          <Pressable
            style={styles.contactItem}
            accessibilityRole="button"
          >
            <Ionicons
              name="call-outline"
              size={24}
              color={colors.primary}
            />

            <AppText
              variant="caption"
              style={styles.contactText}
            >
              +63 XXX XXX XXXX
            </AppText>
          </Pressable>

          {/* Email */}
          <Pressable
            style={styles.contactItem}
            accessibilityRole="button"
          >
            <Ionicons
              name="mail-outline"
              size={24}
              color={colors.primary}
            />

            <AppText
              variant="caption"
              style={styles.contactText}
            >
              adlawatt@gmail.com
            </AppText>
          </Pressable>
        </View>

        {/* Copyright */}
        <Copyright />
      </ScrollView>
    </ScreenContainer2>
  );
}

/* =========================================================
   Developer Profile Component
   ========================================================= */

interface DeveloperProfileProps {
  image: any;
  name: string;
  role: string;
  roleColor: string;
  description: string;
}

function DeveloperProfile({
  image,
  name,
  role,
  roleColor,
  description,
}: DeveloperProfileProps) {
  const colors = useAppColors();

  const styles = useMemo(
    () => getStyles(colors),
    [colors],
  );

  return (
    <View style={styles.developerRow}>
      {/* Left Side */}
      <View style={styles.developerVisual}>
        {/* Circular Developer Image */}
        <Image
          source={image}
          style={styles.developerImage}
          resizeMode="cover"
        />

        {/* Role Badge */}
        <View
          style={[
            styles.roleBadge,
            {
              backgroundColor: roleColor,
            },
          ]}
        >
          <AppText
            variant="caption"
            style={[
              styles.roleText,
              {
                color:
                  roleColor === colors.primary
                    ? colors.onPrimary
                    : colors.text,
              },
            ]}
          >
            {role}
          </AppText>
        </View>
      </View>

      {/* Right Side Glass Container */}
      <View style={styles.developerInfo}>
        <AppText
          variant="body"
          style={styles.developerName}
        >
          {name}
        </AppText>

        <AppText
          variant="caption"
          style={styles.developerDescription}
        >
          {description}
        </AppText>
      </View>
    </View>
  );
}

/* =========================================================
   Dimensions
   ========================================================= */

const aboutDimensions = {
  horizontalPadding: 14,

  sectionSpacing: 18,

  headerRadius: 16,
  headerBorderWidth: 3,

  glassRadius: 16,
  glassBorderWidth: 2,

  developerImageSize: 82,

  roleHeight: 28,
  roleRadius: 14,

  developerGap: 12,

  contactRadius: 14,

  contentBottomPadding: 24,
};

/* =========================================================
   Styles
   ========================================================= */

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    paddingHorizontal:
      aboutDimensions.horizontalPadding,

    paddingTop: aboutDimensions.sectionSpacing,

    paddingBottom:
      aboutDimensions.contentBottomPadding,
  },

  /* -------------------------------------------------------
     About Us Header
     ------------------------------------------------------- */

  headerCard: {
    backgroundColor: colors.glass.white,

    borderWidth:
      aboutDimensions.headerBorderWidth,

    borderColor: colors.secondary,

    borderRadius:
      aboutDimensions.headerRadius,

    padding: 18,

    marginBottom: 20,
  },

  headerTitle: {
    color: colors.text,

    fontWeight: "700",
  },

  headerSubtitle: {
    color: colors.textSecondary,

    marginTop: 6,

    lineHeight: 20,
  },

  /* -------------------------------------------------------
     AdlaWatt Introduction
     ------------------------------------------------------- */

  introduction: {
    width: "100%",

    marginBottom: 22,
  },

  adlawattTitle: {
    color: colors.text,

    fontWeight: "700",

    fontSize: 24,
  },

  adlawattSubtitle: {
    color: colors.textSecondary,

    marginTop: 5,

    lineHeight: 20,

    fontWeight: "500",
  },

  overview: {
    color: colors.text,

    marginTop: 14,

    lineHeight: 22,

    fontWeight: "400",

    textAlign: "left",
  },

  /* -------------------------------------------------------
     Section Titles
     ------------------------------------------------------- */

  sectionTitle: {
    color: colors.text,

    fontWeight: "700",

    fontSize: 19,

    marginBottom: 16,
  },

  /* -------------------------------------------------------
     Developers
     ------------------------------------------------------- */

  developerRow: {
    width: "100%",

    flexDirection: "row",

    alignItems: "flex-start",

    marginBottom: 18,

    gap: aboutDimensions.developerGap,
  },

  developerVisual: {
    width: aboutDimensions.developerImageSize,

    alignItems: "center",
  },

  developerImage: {
    width: aboutDimensions.developerImageSize,

    height: aboutDimensions.developerImageSize,

    borderRadius:
      aboutDimensions.developerImageSize / 2,
  },

  roleBadge: {
    minHeight:
      aboutDimensions.roleHeight,

    borderRadius:
      aboutDimensions.roleRadius,

    paddingHorizontal: 9,

    alignItems: "center",

    justifyContent: "center",

    marginTop: 7,

    maxWidth: aboutDimensions.developerImageSize,
  },

  roleText: {
    fontSize: 10,

    fontWeight: "700",

    textAlign: "center",
  },

  /* -------------------------------------------------------
     Developer Glass Information
     ------------------------------------------------------- */

  developerInfo: {
    flex: 1,

    backgroundColor: colors.glass.white,

    borderWidth:
      aboutDimensions.glassBorderWidth,

    borderColor: colors.secondary,

    borderRadius:
      aboutDimensions.glassRadius,

    padding: 13,

    minHeight: aboutDimensions.developerImageSize,
  },

  developerName: {
    color: colors.text,

    fontWeight: "600",

    fontSize: 16,

    lineHeight: 21,
  },

  developerDescription: {
    color: colors.textSecondary,

    marginTop: 6,

    lineHeight: 18,

    fontWeight: "400",

    fontSize: 12,
  },

  /* -------------------------------------------------------
     Contact Details
     ------------------------------------------------------- */

  contactTitle: {
    marginTop: 8,

    marginBottom: 12,
  },

  contactList: {
    width: "100%",

    marginBottom: 20,
  },

  contactItem: {
    width: "100%",

    flexDirection: "row",

    alignItems: "center",

    gap: 12,

    backgroundColor: colors.glass.white,

    borderWidth:
      aboutDimensions.glassBorderWidth,

    borderColor: colors.secondary,

    borderRadius:
      aboutDimensions.contactRadius,

    paddingHorizontal: 15,

    minHeight: 50,

    marginBottom: 10,
  },

  contactText: {
    color: colors.text,

    fontWeight: "500",

    flex: 1,
  },
});