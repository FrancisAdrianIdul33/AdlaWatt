import React, { useEffect, useMemo, useState } from "react";

import {
  Alert,
  BackHandler,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

import { router } from "expo-router";

import Copyright from "@/components/ui/Copyright";
import NavBar from "@/components/layout/Navbar";
import ScreenContainer2 from "@/components/layout/ScreenContainer2";
import AppText from "@/components/ui/AppText";
import {
  DropdownModal,
  RadioOptionRow,
} from "@/components/ui/DropdownModal";

import {
  useAppColors,
  type AppColors,
} from "@/hooks/useAppColors";
import { Radius } from "@/constants/theme";
import { Routes } from "@/constants/routes";

import {
  getCurrentUserProfile,
  updateAccount,
} from "@/services/auth";

import { supabase } from "@/lib/supabase";

import { useSettings } from "@/context/SettingsContext";
import { useTheme } from "@/context/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import {
  FONT_FAMILY_OPTIONS,
  type FontFamilyOption,
  type FontSizeOption,
} from "@/services/typography";

import { Ionicons } from "@expo/vector-icons";

export default function SettingsScreen() {
  // ============================================
  // DROPDOWN STATES
  // ============================================

  const [accountExpanded, setAccountExpanded] =
    useState(false);

  const [preferencesExpanded, setPreferencesExpanded] =
    useState(false);

  // ============================================
  // ACCOUNT STATES
  // ============================================

  const [isEditingAccount, setIsEditingAccount] =
    useState(false);

  const [username, setUsername] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [editUsername, setEditUsername] =
    useState("");

  const [editEmail, setEditEmail] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmNewPassword, setConfirmNewPassword] =
    useState("");

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [confirmationVisible, setConfirmationVisible] =
    useState(false);

  const [warning, setWarning] =
    useState("");

  const [confirmationWarning, setConfirmationWarning] =
    useState("");

  const [loadingAccount, setLoadingAccount] =
    useState(false);

  const [confirmingAccountUpdate, setConfirmingAccountUpdate] =
    useState(false);

  // ============================================
  // PREFERENCES
  // ============================================

  const [darkMode, setDarkMode] =
    useState(false);

  const [colorBlindMode, setColorBlindMode] =
    useState(false);

  const [fontSize, setFontSize] =
    useState<FontSizeOption>("Medium");

  const [fontFamily, setFontFamily] =
    useState<FontFamilyOption>(
      "System Default",
    );

  const [language, setLanguage] =
    useState("English");

  const [vibration, setVibration] =
    useState(true);

  const [emailNotifications, setEmailNotifications] =
    useState(false);

  // ============================================
  // PREFERENCE DROPDOWNS
  // ============================================

  const [fontFamilyOpen, setFontFamilyOpen] =
    useState(false);

  const [languageOpen, setLanguageOpen] =
    useState(false);

  // ============================================
  // PREFERENCES DRAFT (system preferences)
  //
  // Typography + theme edits apply on Save; Cancel / X
  // discards back to the saved values. Color blind mode
  // stays local-only and is intentionally excluded.
  // ============================================

  const {
    prefs: savedTypography,
    setPreferences: commitTypography,
  } = useSettings();

  // Dark mode is staged like typography: flipping only
  // updates local state, Save commits the theme.
  const {
    theme: savedTheme,
    setTheme: commitTheme,
  } = useTheme();

  const {
    scaledSize: scaledInputSize,
    family: inputFontFamily,
    weight: inputFontWeight,
  } = useTypography();

  const colors = useAppColors();
  const styles = useMemo(
    () => getStyles(colors),
    [colors],
  );

  const inputFontStyle = {
    fontSize: scaledInputSize(15),
    fontFamily: inputFontFamily,
    fontWeight: inputFontWeight,
  };

  const [isSavingPreferences, setIsSavingPreferences] =
    useState(false);

  useEffect(() => {
    if (preferencesExpanded) {
      setFontSize(savedTypography.fontSize);
      setFontFamily(savedTypography.fontFamily);
      setDarkMode(savedTheme === "dark");
      setFontFamilyOpen(false);
      setLanguageOpen(false);
    }
  }, [
    preferencesExpanded,
    savedTypography,
    savedTheme,
  ]);

  // Staged only: Save commits the theme together with
  // typography. Flipping previews nothing by itself.
  const handleDarkModeChange = (
    value: boolean,
  ) => {
    setDarkMode(value);
  };

  const handleClosePreferences = () => {
    if (isSavingPreferences) {
      return;
    }

    setFontSize(savedTypography.fontSize);
    setFontFamily(savedTypography.fontFamily);
    setDarkMode(savedTheme === "dark");
    setFontFamilyOpen(false);
    setLanguageOpen(false);
    setPreferencesExpanded(false);
  };

  const handleSavePreferences = async () => {
    if (isSavingPreferences) {
      return;
    }

    try {
      setIsSavingPreferences(true);

      await commitTypography({
        fontSize,
        fontFamily,
      });

      // Theme last: the flip re-renders screens, so it
      // lands as the modal closes instead of mid-save.
      await commitTheme(
        darkMode ? "dark" : "light",
      );

      setFontFamilyOpen(false);
      setLanguageOpen(false);
      setPreferencesExpanded(false);
    } finally {
      setIsSavingPreferences(false);
    }
  };

  // ============================================
  // LOAD ACCOUNT PROFILE
  // ============================================

  useEffect(() => {
    const loadAccount = async () => {
      setLoadingAccount(true);

      const result =
        await getCurrentUserProfile();

      if (!result.success) {
        setWarning(result.error ?? "");
        setLoadingAccount(false);
        return;
      }

      const loadedUsername =
        result.username ?? "";

      const loadedEmail =
        result.email ?? "";

      setUsername(loadedUsername);
      setEmail(loadedEmail);

      setEditUsername(loadedUsername);
      setEditEmail(loadedEmail);

      setLoadingAccount(false);
    };

    loadAccount();
  }, []);

  // ============================================
  // OPEN ACCOUNT EDITING
  // ============================================

  const handleUpdatePress = () => {
    setEditUsername(username);
    setEditEmail(email);

    setNewPassword("");
    setConfirmNewPassword("");
    setCurrentPassword("");

    setWarning("");
    setConfirmationWarning("");

    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);

    setIsEditingAccount(true);
  };

  // ============================================
  // CANCEL ACCOUNT UPDATE
  // ============================================

  const handleCancelUpdate = () => {
    setEditUsername(username);
    setEditEmail(email);

    setNewPassword("");
    setConfirmNewPassword("");
    setCurrentPassword("");

    setWarning("");
    setConfirmationWarning("");

    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);

    setConfirmationVisible(false);
    setIsEditingAccount(false);
  };

  // ============================================
  // CLOSE ACCOUNT MODAL
  //
  // X / backdrop / back button: discard any inputted
  // data and restore normal view state, then hide modal.
  // Distinct from handleCancelUpdate (footer Cancel),
  // which exits edit mode but keeps the modal open.
  // ============================================

  const handleCloseAccountModal = () => {
    if (confirmingAccountUpdate) {
      return;
    }

    handleCancelUpdate();
    setAccountExpanded(false);
  };

  // ============================================
  // SUBMIT ACCOUNT UPDATE
  // ============================================

  const handleSubmitAccountUpdate = () => {
    if (confirmingAccountUpdate) {
      return;
    }

    setWarning("");

    const cleanUsername =
      editUsername.trim().toLowerCase();

    const cleanEmail =
      editEmail.trim().toLowerCase();

    // --------------------------------------------
    // USERNAME VALIDATION
    // --------------------------------------------

    if (!cleanUsername) {
      setWarning("Please enter a username.");
      return;
    }

    if (cleanUsername.length < 3) {
      setWarning(
        "Username must be at least 3 characters.",
      );
      return;
    }

    if (cleanUsername.length > 30) {
      setWarning(
        "Username must not exceed 30 characters.",
      );
      return;
    }

    if (
      !/^[a-zA-Z0-9_]+$/.test(
        cleanUsername,
      )
    ) {
      setWarning(
        "Username can only contain letters, numbers, and underscores.",
      );
      return;
    }

    // --------------------------------------------
    // EMAIL VALIDATION
    // --------------------------------------------

    if (!cleanEmail) {
      setWarning(
        "Please enter your email address.",
      );
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        cleanEmail,
      )
    ) {
      setWarning(
        "Enter a valid email address.",
      );
      return;
    }

    // --------------------------------------------
    // PASSWORD VALIDATION
    // --------------------------------------------

    if (
      newPassword ||
      confirmNewPassword
    ) {
      if (newPassword.length < 8) {
        setWarning(
          "Password must be at least 8 characters.",
        );
        return;
      }

      if (newPassword.length > 72) {
        setWarning(
          "Password must not exceed 72 characters.",
        );
        return;
      }

      if (
        newPassword !==
        confirmNewPassword
      ) {
        setWarning(
          "Passwords do not match.",
        );
        return;
      }
    }

    // --------------------------------------------
    // CHECK IF ANYTHING CHANGED
    // --------------------------------------------

    const usernameChanged =
      cleanUsername !== username;

    const emailChanged =
      cleanEmail !== email;

    const passwordChanged =
      newPassword.length > 0;

    if (
      !usernameChanged &&
      !emailChanged &&
      !passwordChanged
    ) {
      setWarning(
        "No account changes were made.",
      );
      return;
    }

    // --------------------------------------------
    // OPEN PASSWORD CONFIRMATION
    // --------------------------------------------

    setEditUsername(cleanUsername);
    setEditEmail(cleanEmail);

    setCurrentPassword("");
    setConfirmationWarning("");
    setConfirmationVisible(true);
  };

  // ============================================
  // CONFIRM ACCOUNT UPDATE
  // ============================================

  const handleConfirmChanges = async () => {
    if (confirmingAccountUpdate) {
      return;
    }

    setConfirmationWarning("");

    const password =
      currentPassword;

    if (!password) {
      setConfirmationWarning(
        "Enter your current password.",
      );
      return;
    }

    if (password.length < 8) {
      setConfirmationWarning(
        "Current password must be at least 8 characters.",
      );
      return;
    }

    try {
      setConfirmingAccountUpdate(true);

      const result =
        await updateAccount(
          editUsername,
          editEmail,
          password,
          newPassword || undefined,
        );

      if (!result.success) {
        setConfirmationWarning(
          result.error ??
            "Unable to update your account.",
        );
        return;
      }

      const updatedUsername =
        result.username ??
        editUsername.trim().toLowerCase();

      const updatedEmail =
        result.email ??
        editEmail.trim().toLowerCase();

      setUsername(updatedUsername);
      setEmail(updatedEmail);

      setEditUsername(updatedUsername);
      setEditEmail(updatedEmail);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");

      setWarning("");
      setConfirmationWarning("");

      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);

      setConfirmationVisible(false);
      setIsEditingAccount(false);

      if (result.emailChangePending) {
        Alert.alert(
          "Account Updated",
          result.message ??
            "Your username was updated. Please confirm your new email address.",
        );
      } else {
        Alert.alert(
          "Changes Saved",
          "Your account information has been updated successfully.",
        );
      }
    } catch (error) {
      console.error(
        "Account update error:",
        error,
      );

      setConfirmationWarning(
        "Unable to update your account. Please try again.",
      );
    } finally {
      setConfirmingAccountUpdate(false);
    }
  };

  // ============================================
  // TOGGLE
  // ============================================

  const renderToggle = (
    value: boolean,
    onValueChange: (
      value: boolean,
    ) => void,
    // When true the Switch is purely visual and its row
    // handles taps (avoids double-toggle from nested press).
    decorative: boolean = false,
  ) => (
    <Switch
      value={value}
      onValueChange={onValueChange}
      pointerEvents={
        decorative ? "none" : "auto"
      }
      trackColor={{
        false: colors.border,
        true: colors.primary,
      }}
      thumbColor={colors.surface}
      ios_backgroundColor={
        colors.border
      }
    />
  );

  // ============================================
  // LOG OUT
  // ============================================

  const { height: windowHeight } = useWindowDimensions();

  const handleLogout = () => {
    const logout = async () => {
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.warn(
          "Sign out failed:",
          error instanceof Error
            ? error.message
            : error,
        );
      } finally {
        router.replace(Routes.LOGIN);
      }
    };

    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "Are you sure you want to sign out?",
      );

      if (confirmed) {
        logout();
      }

      return;
    }

    Alert.alert(
      "Log Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "No",
          style: "cancel",
        },
        {
          text: "Yes",
          style: "destructive",
          onPress: logout,
        },
      ],
    );
  };

  // ============================================
  // EXIT APP
  //
  // iOS forbids programmatic quit, so the Exit button is
  // hidden there (see render). Web tabs usually cannot be
  // closed by script, so a manual-close note is shown.
  // ============================================

  const handleExit = () => {
    const exitApp = () => {
      if (Platform.OS === "android") {
        BackHandler.exitApp();
        return;
      }

      if (Platform.OS === "web") {
        window.close();

        Alert.alert(
          "Exit",
          "Please close this tab manually to exit AdlaWatt.",
        );
      }
    };

    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "Are you sure you want to exit AdlaWatt?",
      );

      if (confirmed) {
        exitApp();
      }

      return;
    }

    Alert.alert(
      "Exit App",
      "AdlaWatt will close. Are you sure?",
      [
        {
          text: "No",
          style: "cancel",
        },
        {
          text: "Yes",
          style: "destructive",
          onPress: exitApp,
        },
      ],
    );
  };

  return (
    <ScreenContainer2>
      <NavBar />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Settings Header */}
        <View style={styles.headerCard}>
          <AppText
            variant="heading"
            style={styles.headerTitle}
          >
            Menu
          </AppText>

          <AppText
            variant="caption"
            style={styles.headerSubtitle}
          >
            Browse and manage your AdlaWatt application.
          </AppText>
        </View>

        {/* ================= MENU BOXES ================= */}

        <View style={styles.menuGrid}>
          <Pressable
            onPress={() =>
              setAccountExpanded(true)
            }
            accessibilityRole="button"
            accessibilityLabel="Open Account Profile"
            style={({ pressed }) => [
              styles.menuBox,
              accountExpanded &&
                styles.menuBoxActive,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="person"
              size={60}
              color={colors.primary}
            />

            <AppText
              variant="body"
              style={styles.menuBoxText}
            >
              Account Profile
            </AppText>
          </Pressable>

          <Pressable
            onPress={() =>
              setPreferencesExpanded(true)
            }
            accessibilityRole="button"
            accessibilityLabel="Open Preferences"
            style={({ pressed }) => [
              styles.menuBox,
              preferencesExpanded &&
                styles.menuBoxActive,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="settings"
              size={60}
              color={colors.primary}
            />

            <AppText
              variant="body"
              style={styles.menuBoxText}
            >
              Preferences
            </AppText>
          </Pressable>

          <Pressable
            onPress={() =>
              router.push(
                Routes.COMPONENTS,
              )
            }
            accessibilityRole="button"
            accessibilityLabel="Open Components"
            style={({ pressed }) => [
              styles.menuBox,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="hardware-chip"
              size={60}
              color={colors.primary}
            />

            <AppText
              variant="body"
              style={styles.menuBoxText}
            >
              Components
            </AppText>
          </Pressable>

          <Pressable
            onPress={() =>
              router.push(
                Routes.ACTIVITY_LOGS,
              )
            }
            accessibilityRole="button"
            accessibilityLabel="Open Activity Logs"
            style={({ pressed }) => [
              styles.menuBox,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="list"
              size={60}
              color={colors.primary}
            />

            <AppText
              variant="body"
              style={styles.menuBoxText}
            >
              Activity Logs
            </AppText>
          </Pressable>

          <Pressable
            onPress={() =>
              router.push(
                Routes.ABOUT_US,
              )
            }
            accessibilityRole="button"
            accessibilityLabel="Open About Us"
            style={({ pressed }) => [
              styles.menuBox,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="information-circle"
              size={60}
              color={colors.primary}
            />

            <AppText
              variant="body"
              style={styles.menuBoxText}
            >
              About Us
            </AppText>
          </Pressable>
        </View>

        {/* ================= ACCOUNT PROFILE MODAL ================= */}

        <DropdownModal
          visible={accountExpanded}
          title="Account Profile"
          onClose={handleCloseAccountModal}
        >
          <ScrollView
            style={[
              styles.modalScroll,
              {
                maxHeight:
                  windowHeight * 0.55,
              },
            ]}
            showsVerticalScrollIndicator={
              false
            }
          >
              {loadingAccount ? (
                <AppText
                  variant="caption"
                  style={styles.infoValue}
                >
                  Loading account information...
                </AppText>
              ) : !isEditingAccount ? (
                <>
                  {/* Username */}
                  <View style={styles.infoRow}>
                    <AppText
                      variant="caption"
                      style={styles.infoLabel}
                    >
                      Username
                    </AppText>

                    <AppText
                      variant="body"
                      style={styles.infoValue}
                    >
                      {username}
                    </AppText>
                  </View>

                  {/* Email */}
                  <View style={styles.infoRow}>
                    <AppText
                      variant="caption"
                      style={styles.infoLabel}
                    >
                      Email
                    </AppText>

                    <AppText
                      variant="body"
                      style={styles.infoValue}
                    >
                      {email}
                    </AppText>
                  </View>

                  <Pressable
                    onPress={handleUpdatePress}
                    style={({ pressed }) => [
                      styles.primaryButton,
                      pressed &&
                        styles.pressed,
                    ]}
                  >
                    <AppText
                      style={
                        styles.primaryButtonText
                      }
                    >
                      Update
                    </AppText>
                  </Pressable>
                </>
              ) : (
                <>
                  {/* Username */}
                  <View style={styles.inputGroup}>
                    <AppText
                      variant="caption"
                      style={styles.inputLabel}
                    >
                      Username
                    </AppText>

                    <TextInput
                      value={editUsername}
                      onChangeText={(text) => {
                        setEditUsername(text);
                        setWarning("");
                      }}
                      allowFontScaling={false}
                      style={[
                        styles.input,
                        inputFontStyle,
                      ]}
                      placeholder="Enter username"
                      placeholderTextColor={
                        colors.textSecondary
                      }
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  {/* Email */}
                  <View style={styles.inputGroup}>
                    <AppText
                      variant="caption"
                      style={styles.inputLabel}
                    >
                      Email
                    </AppText>

                    <TextInput
                      value={editEmail}
                      onChangeText={(text) => {
                        setEditEmail(text);
                        setWarning("");
                      }}
                      allowFontScaling={false}
                      style={[
                        styles.input,
                        inputFontStyle,
                      ]}
                      placeholder="Enter email"
                      placeholderTextColor={
                        colors.textSecondary
                      }
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  {/* New Password */}
                  <View style={styles.inputGroup}>
                    <AppText
                      variant="caption"
                      style={styles.inputLabel}
                    >
                      New Password
                    </AppText>

                    <View
                      style={
                        styles.passwordInputContainer
                      }
                    >
                      <TextInput
                        value={newPassword}
                        onChangeText={(text) => {
                          setNewPassword(text);
                          setWarning("");
                        }}
                        allowFontScaling={false}
                        style={[
                          styles.passwordInput,
                          inputFontStyle,
                        ]}
                        placeholder="Leave blank to keep current"
                        placeholderTextColor={
                          colors.textSecondary
                        }
                        secureTextEntry={
                          !showNewPassword
                        }
                      />

                      <Pressable
                        onPress={() =>
                          setShowNewPassword(
                            (current) =>
                              !current,
                          )
                        }
                        style={
                          styles.eyeButton
                        }
                      >
                        <Ionicons
                          name={
                            showNewPassword
                              ? "eye-outline"
                              : "eye-off-outline"
                          }
                          size={22}
                          color={colors.text}
                        />
                      </Pressable>
                    </View>
                  </View>

                  {/* Confirm New Password */}
                  <View style={styles.inputGroup}>
                    <AppText
                      variant="caption"
                      style={styles.inputLabel}
                    >
                      Confirm New Password
                    </AppText>

                    <View
                      style={
                        styles.passwordInputContainer
                      }
                    >
                      <TextInput
                        value={
                          confirmNewPassword
                        }
                        onChangeText={(text) => {
                          setConfirmNewPassword(
                            text,
                          );
                          setWarning("");
                        }}
                        allowFontScaling={false}
                        style={[
                          styles.passwordInput,
                          inputFontStyle,
                        ]}
                        placeholder="Confirm new password"
                        placeholderTextColor={
                          colors.textSecondary
                        }
                        secureTextEntry={
                          !showConfirmPassword
                        }
                      />

                      <Pressable
                        onPress={() =>
                          setShowConfirmPassword(
                            (current) =>
                              !current,
                          )
                        }
                        style={
                          styles.eyeButton
                        }
                      >
                        <Ionicons
                          name={
                            showConfirmPassword
                              ? "eye-outline"
                              : "eye-off-outline"
                          }
                          size={22}
                          color={colors.text}
                        />
                      </Pressable>
                    </View>
                  </View>

                  {/* Warning */}
                  {warning ? (
                    <View
                      style={
                        styles.warningContainer
                      }
                    >
                      <Ionicons
                        name="alert-circle-outline"
                        size={18}
                        color={colors.error}
                      />

                      <AppText
                        style={
                          styles.warningText
                        }
                      >
                        {warning}
                      </AppText>
                    </View>
                  ) : null}

                </>
              )}
          </ScrollView>

          {isEditingAccount &&
          !loadingAccount ? (
            <View style={styles.modalFooter}>
              <Pressable
                onPress={handleCancelUpdate}
                disabled={
                  confirmingAccountUpdate
                }
                accessibilityRole="button"
                accessibilityLabel="Cancel account changes"
                style={({ pressed }) => [
                  styles.modalFooterButton,
                  styles.modalCancelButton,
                  pressed && styles.pressed,
                ]}
              >
                <AppText
                  variant="body"
                  style={
                    styles.modalCancelButtonText
                  }
                >
                  Cancel
                </AppText>
              </Pressable>

              <Pressable
                onPress={
                  handleSubmitAccountUpdate
                }
                disabled={
                  confirmingAccountUpdate
                }
                accessibilityRole="button"
                accessibilityLabel="Submit account changes"
                style={({ pressed }) => [
                  styles.modalFooterButton,
                  styles.modalSubmitButton,
                  pressed && styles.pressed,
                ]}
              >
                <AppText
                  variant="body"
                  style={
                    styles.modalSubmitButtonText
                  }
                >
                  Submit
                </AppText>
              </Pressable>
            </View>
          ) : null}
        </DropdownModal>

        {/* ================= PREFERENCES MODAL ================= */}

        <DropdownModal
          visible={preferencesExpanded}
          title="Preferences"
          onClose={handleClosePreferences}
        >
          <View style={styles.modalBody}>
              {/* Dark Mode: whole row toggles so the target
                  is the full row, not just the Switch. */}
              <Pressable
                onPress={() =>
                  handleDarkModeChange(!darkMode)
                }
                accessibilityRole="switch"
                accessibilityState={{
                  checked: darkMode,
                }}
                accessibilityLabel="Dark Mode"
                style={({ pressed }) => [
                  styles.preferenceRow,
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={styles.preferenceText}
                >
                  <AppText
                    variant="body"
                    style={
                      styles.preferenceTitle
                    }
                  >
                    Dark Mode
                  </AppText>

                  <AppText
                    variant="caption"
                    style={
                      styles.preferenceDescription
                    }
                  >
                    Switch between light and dark
                    appearance.
                  </AppText>
                </View>

                {renderToggle(
                  darkMode,
                  handleDarkModeChange,
                  true,
                )}
              </Pressable>

              <View style={styles.preferenceRow}>
                <View
                  style={styles.preferenceText}
                >
                  <AppText
                    variant="body"
                    style={
                      styles.preferenceTitle
                    }
                  >
                    Color Blind Mode
                  </AppText>

                  <AppText
                    variant="caption"
                    style={
                      styles.preferenceDescription
                    }
                  >
                    Adjust colors for better accessibility.
                  </AppText>
                </View>

                {renderToggle(
                  colorBlindMode,
                  setColorBlindMode,
                )}
              </View>

              {/* Font Size */}
              <View
                style={styles.preferenceBlock}
              >
                <AppText
                  variant="caption"
                  style={styles.groupLabel}
                >
                  Font Size
                </AppText>

                <View style={styles.optionRow}>
                  {[
                    "Small",
                    "Medium",
                    "Big",
                  ].map((option) => (
                    <Pressable
                      key={option}
                      onPress={() =>
                        setFontSize(
                          option as
                            | "Small"
                            | "Medium"
                            | "Big",
                        )
                      }
                      accessibilityRole="radio"
                      accessibilityState={{
                        selected:
                          fontSize === option,
                      }}
                      accessibilityLabel={`Font size ${option}`}
                      style={[
                        styles.optionButton,
                        fontSize === option &&
                          styles.selectedOption,
                      ]}
                    >
                      <AppText
                        style={[
                          styles.optionText,
                          fontSize ===
                            option &&
                            styles.selectedOptionText,
                        ]}
                      >
                        {option}
                      </AppText>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Font Family */}
              <View
                style={styles.preferenceBlock}
              >
                <AppText
                  variant="caption"
                  style={styles.groupLabel}
                >
                  Font Family
                </AppText>

                <Pressable
                  onPress={() => {
                    setFontFamilyOpen(true);
                    setLanguageOpen(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Choose font family"
                  accessibilityHint={`Current: ${fontFamily}`}
                  style={
                    styles.dropdownInput
                  }
                >
                  <AppText
                    style={
                      styles.dropdownInputText
                    }
                  >
                    {fontFamily}
                  </AppText>

                  <Ionicons
                    name="chevron-down-outline"
                    size={22}
                    color={colors.text}
                  />
                </Pressable>
              </View>

              <View
                style={styles.preferenceBlock}
              >
                <Pressable
                  onPress={() => {
                    setLanguageOpen(true);
                    setFontFamilyOpen(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Choose language"
                  accessibilityHint={`Current: ${language}`}
                  style={
                    styles.dropdownInput
                  }
                >
                  <AppText
                    style={
                      styles.dropdownInputText
                    }
                  >
                    {language}
                  </AppText>

                  <Ionicons
                    name="chevron-down-outline"
                    size={22}
                    color={colors.text}
                  />
                </Pressable>
              </View>

              <View style={styles.preferenceRow}>
                <View
                  style={styles.preferenceText}
                >
                  <AppText
                    variant="body"
                    style={
                      styles.preferenceTitle
                    }
                  >
                    Vibration
                  </AppText>

                  <AppText
                    variant="caption"
                    style={
                      styles.preferenceDescription
                    }
                  >
                    Vibrate when important alerts are received.
                  </AppText>
                </View>

                {renderToggle(
                  vibration,
                  setVibration,
                )}
              </View>

              <View style={styles.preferenceRow}>
                <View
                  style={styles.preferenceText}
                >
                  <AppText
                    variant="body"
                    style={
                      styles.preferenceTitle
                    }
                  >
                    Email Notifications
                  </AppText>

                  <AppText
                    variant="caption"
                    style={
                      styles.preferenceDescription
                    }
                  >
                    Allow AdlaWatt to send alerts and notifications through your email.
                  </AppText>
                </View>

                {renderToggle(
                  emailNotifications,
                  setEmailNotifications,
                )}
              </View>
          </View>

          <View style={styles.modalFooter}>
            <Pressable
              onPress={handleClosePreferences}
              disabled={isSavingPreferences}
              accessibilityRole="button"
              accessibilityLabel="Cancel Preferences"
              style={({ pressed }) => [
                styles.modalFooterButton,
                styles.modalCancelButton,
                pressed && styles.pressed,
              ]}
            >
              <AppText
                variant="body"
                style={
                  styles.modalCancelButtonText
                }
              >
                Cancel
              </AppText>
            </Pressable>

            <Pressable
              onPress={handleSavePreferences}
              disabled={isSavingPreferences}
              accessibilityRole="button"
              accessibilityLabel="Save Preferences"
              style={({ pressed }) => [
                styles.modalFooterButton,
                styles.modalSubmitButton,
                pressed && styles.pressed,
              ]}
            >
              <AppText
                variant="body"
                style={
                  styles.modalSubmitButtonText
                }
              >
                {isSavingPreferences
                  ? "Saving..."
                  : "Save"}
              </AppText>
            </Pressable>
          </View>
        </DropdownModal>

        {/* ================= FONT FAMILY PICKER ================= */}

        <DropdownModal
          visible={fontFamilyOpen}
          title="Font Family"
          onClose={() =>
            setFontFamilyOpen(false)
          }
        >
          {FONT_FAMILY_OPTIONS.map(
            (font) => (
              <RadioOptionRow
                key={font}
                label={font}
                selected={fontFamily === font}
                onPress={() => {
                  setFontFamily(font);
                  setFontFamilyOpen(false);
                }}
              />
            ),
          )}
        </DropdownModal>

        {/* ================= LANGUAGE PICKER ================= */}

        <DropdownModal
          visible={languageOpen}
          title="Language"
          onClose={() =>
            setLanguageOpen(false)
          }
        >
          {[
            "English",
            "Cebuano (Bisaya)",
            "Tagalog",
          ].map((item) => (
            <RadioOptionRow
              key={item}
              label={item}
              selected={language === item}
              onPress={() => {
                setLanguage(item);
                setLanguageOpen(false);
              }}
            />
          ))}
        </DropdownModal>

        <View
          style={styles.versionSection}
        >
          <View style={styles.versionCard}>
            <AppText
              variant="body"
              style={styles.versionTitle}
            >
              AdlaWatt
            </AppText>

            <AppText
              variant="caption"
              style={styles.versionNumber}
            >
              v1.0.0
            </AppText>
          </View>
        </View>

        <View style={styles.authActionRow}>
          <Pressable
            onPress={handleLogout}
            accessibilityRole="button"
            accessibilityLabel="Log out"
            style={({ pressed }) => [
              styles.authActionButton,
              styles.logOutButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="log-out-outline"
              size={22}
              color={colors.error}
            />

            <AppText
              variant="body"
              style={styles.logOutButtonText}
            >
              Log Out
            </AppText>
          </Pressable>

          {Platform.OS !== "ios" && (
            <Pressable
              onPress={handleExit}
              accessibilityRole="button"
              accessibilityLabel="Exit app"
              style={({ pressed }) => [
                styles.authActionButton,
                styles.exitButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name="exit-outline"
                size={22}
                color={colors.text}
              />

              <AppText
                variant="body"
                style={styles.exitButtonText}
              >
                Exit
              </AppText>
            </Pressable>
          )}
        </View>

        <Copyright />
      </ScrollView>

      {/* Password Confirmation Modal */}
      <Modal
        visible={confirmationVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (
            !confirmingAccountUpdate
          ) {
            setConfirmationVisible(false);
            setConfirmationWarning("");
            setCurrentPassword("");
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <AppText
              variant="heading"
              style={styles.modalTitle}
            >
              Confirm Changes
            </AppText>

            <AppText
              variant="caption"
              style={styles.modalDescription}
            >
              Enter your current password to confirm these account changes.
            </AppText>

            {confirmationWarning ? (
              <View
                style={
                  styles.warningContainer
                }
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={18}
                  color={colors.error}
                />

                <AppText
                  style={
                    styles.warningText
                  }
                >
                  {confirmationWarning}
                </AppText>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <AppText
                variant="caption"
                style={styles.inputLabel}
              >
                Current Password
              </AppText>

              <View
                style={
                  styles.passwordInputContainer
                }
              >
                <TextInput
                  value={currentPassword}
                  onChangeText={(text) => {
                    setCurrentPassword(text);
                    setConfirmationWarning("");
                  }}
                  allowFontScaling={false}
                  style={[
                    styles.passwordInput,
                    inputFontStyle,
                  ]}
                  placeholder="Enter current password"
                  placeholderTextColor={
                    colors.textSecondary
                  }
                  secureTextEntry={
                    !showCurrentPassword
                  }
                  editable={
                    !confirmingAccountUpdate
                  }
                />

                <Pressable
                  onPress={() =>
                    setShowCurrentPassword(
                      (current) =>
                        !current,
                    )
                  }
                  style={
                    styles.eyeButton
                  }
                  disabled={
                    confirmingAccountUpdate
                  }
                >
                  <Ionicons
                    name={
                      showCurrentPassword
                        ? "eye-outline"
                        : "eye-off-outline"
                    }
                    size={22}
                    color={colors.text}
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.actionRow}>
              <Pressable
                onPress={() => {
                  if (
                    confirmingAccountUpdate
                  ) {
                    return;
                  }

                  setCurrentPassword("");
                  setConfirmationWarning("");
                  setConfirmationVisible(false);
                }}
                disabled={
                  confirmingAccountUpdate
                }
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed &&
                    styles.pressed,
                ]}
              >
                <AppText
                  style={
                    styles.secondaryButtonText
                  }
                >
                  Cancel
                </AppText>
              </Pressable>

              <Pressable
                onPress={
                  handleConfirmChanges
                }
                disabled={
                  confirmingAccountUpdate
                }
                style={({ pressed }) => [
                  styles.primaryButton,
                  styles.actionButton,
                  pressed &&
                    styles.pressed,
                ]}
              >
                <AppText
                  style={
                    styles.primaryButtonText
                  }
                >
                  {confirmingAccountUpdate
                    ? "Saving..."
                    : "Confirm"}
                </AppText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer2>
  );
}

const settingsDimensions = {
  horizontalPadding: 16,
  sectionSpacing: 16,
  borderWidth: 3,
  borderRadius: 16,
  innerRadius: 12,
};

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    scrollView: {
      flex: 1,
      backgroundColor: colors.background,
    },

  content: {
    paddingHorizontal:
      settingsDimensions.horizontalPadding,
    paddingTop: settingsDimensions.sectionSpacing,
    paddingBottom: 30,
  },

  /* ================= HEADER ================= */

  headerCard: {
    backgroundColor: colors.glass.white,
    borderWidth: settingsDimensions.borderWidth,
    borderColor: colors.primary,
    borderRadius: settingsDimensions.borderRadius,
    padding: 18,
    marginBottom: settingsDimensions.sectionSpacing,
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

  /* ================= MENU BOXES ================= */

  menuGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginBottom:
      settingsDimensions.sectionSpacing,
  },

  menuBox: {
    width: "46%",
    maxWidth: 150,
    minHeight: 150,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: Radius.md,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  menuBoxActive: {
    backgroundColor:
      colors.primaryWash,
  },

  menuBoxText: {
    color: colors.text,
    fontWeight: "600",
    fontSize: 16,
    textAlign: "center",
  },

  /* ================= ACCOUNT ================= */

  infoRow: {
    marginBottom: 14,
    paddingHorizontal: 4,
  },

  infoLabel: {
    color: colors.textSecondary,
    fontWeight: "600",
    marginBottom: 4,
  },

  infoValue: {
    color: colors.text,
    fontWeight: "500",
  },

  primaryButton: {
    minHeight: 44,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    alignSelf: "flex-end",
    marginTop: 6,
  },

  primaryButtonText: {
    color: colors.onPrimary,
    fontWeight: "700",
  },

  secondaryButton: {
    minHeight: 44,
    backgroundColor: colors.glass.white,
    borderWidth: 3,
    borderColor: colors.secondary,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  secondaryButtonText: {
    color: colors.secondary,
    fontWeight: "700",
  },

  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
  },

  actionButton: {
    alignSelf: "auto",
    marginTop: 0,
  },

  pressed: {
    opacity: 0.7,
  },

  /* ================= INPUTS ================= */

  inputGroup: {
    marginBottom: 14,
  },

  inputLabel: {
    color: colors.text,
    fontWeight: "600",
    marginBottom: 6,
  },

  input: {
    minHeight: 48,
    backgroundColor: colors.glass.white,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    color: colors.text,
    fontSize: 15,
  },

  passwordInputContainer: {
    minHeight: 48,
    backgroundColor: colors.glass.white,
    borderWidth: 2,
    borderColor: colors.error,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  passwordInput: {
    flex: 1,
    minHeight: 46,
    paddingHorizontal: 14,
    color: colors.text,
    fontSize: 15,
  },

  eyeButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },

  /* ================= PREFERENCES ================= */

  preferenceRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    marginBottom: 12,
  },

  preferenceText: {
    flex: 1,
    paddingRight: 12,
  },

  preferenceTitle: {
    color: colors.text,
    fontWeight: "600",
  },

  preferenceDescription: {
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 18,
  },

  preferenceBlock: {
    width: "100%",
    paddingVertical: 6,
    marginBottom: 12,
  },

  groupLabel: {
    color: colors.text,
    fontWeight: "600",
    marginBottom: 8,
  },

  optionRow: {
    flexDirection: "row",
    gap: 10,
  },

  optionButton: {
    flex: 1,
    minHeight: 48,
    backgroundColor: colors.glass.white,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },

  selectedOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  optionText: {
    color: colors.text,
    fontWeight: "600",
    fontSize: 14,
  },

  selectedOptionText: {
    color: colors.onPrimary,
  },

  dropdownInput: {
    minHeight: 48,
    backgroundColor: colors.glass.white,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  dropdownInputText: {
    color: colors.text,
    fontWeight: "500",
  },

  /* ================= MODAL SHEETS ================= */

  modalScroll: {
    width: "100%",
  },

  // Preferences body sizes to its content (no scrolling).
  modalBody: {
    width: "100%",
  },

  modalFooter: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },

  modalFooterButton: {
    flex: 1,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderRadius: Radius.md,
  },

  modalCancelButton: {
    backgroundColor: colors.surface,
    borderColor: colors.error,
  },

  modalCancelButtonText: {
    color: colors.error,
    fontWeight: "700",
  },

  modalSubmitButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  modalSubmitButtonText: {
    color: colors.onPrimary,
    fontWeight: "700",
  },

  modalCloseButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  modalCloseButtonText: {
    color: colors.onPrimary,
    fontWeight: "700",
  },

  /* ================= VERSION ================= */

  versionSection: {
    marginBottom: 18,
  },

  versionCard: {
    backgroundColor: colors.glass.white,
    borderWidth: settingsDimensions.borderWidth,
    borderColor: colors.secondary,
    borderRadius: settingsDimensions.borderRadius,
    padding: 18,
  },

  versionTitle: {
    color: colors.text,
    fontWeight: "700",
  },

  versionNumber: {
    color: colors.textSecondary,
    marginTop: 4,
  },

  /* ================= LOG OUT + EXIT ================= */

  authActionRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },

  authActionButton: {
    flex: 1,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 2,
    borderRadius: Radius.md,
    backgroundColor: colors.surface,
  },

  logOutButton: {
    borderColor: colors.error,
  },

  logOutButtonText: {
    color: colors.error,
    fontWeight: "700",
  },

  exitButton: {
    borderColor: colors.text,
  },

  exitButtonText: {
    color: colors.text,
    fontWeight: "700",
  },

  /* ================= MODAL ================= */

  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlayStrong,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  modalCard: {
    width: "100%",
    maxWidth: 430,
    backgroundColor: colors.background,
    borderWidth: 3,
    borderColor: colors.primary,
    borderRadius: 18,
    padding: 20,
    elevation: 10,
  },

  modalTitle: {
    color: colors.text,
    fontWeight: "700",
  },

  modalDescription: {
    color: colors.textSecondary,
    marginTop: 7,
    marginBottom: 18,
    lineHeight: 20,
  },

  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  warningText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: "600",
  },
});