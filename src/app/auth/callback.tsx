import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import AppButton from "@/components/ui/AppButton";
import AppText from "@/components/ui/AppText";
import AuthFooter from "@/components/layout/AuthFooter";
import AuthHeader from "@/components/layout/AuthHeader";
import AuthLogo from "@/components/layout/AuthLogo";
import AuthWarning from "@/components/layout/AuthWarning";
import ScreenContainer from "@/components/layout/ScreenContainer";
import Copyright from "@/components/ui/Copyright";
import { Routes } from "@/constants/routes";
import { useAppColors } from "@/hooks/useAppColors";
import { supabase } from "@/lib/supabase";

// ============================================================
// AUTH CALLBACK
// ============================================================
//
// Receives Supabase email-confirmation links on both
// native (adlawatt://auth/callback?code=…) and web
// (/auth/callback?code=…). PKCE code flow is primary;
// token_hash links are verified as fallback.
// ============================================================

type Status = "working" | "success" | "error";

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{
    code?: string;
    token_hash?: string;
    type?: string;
    error?: string;
    error_description?: string;
  }>();

  const colors = useAppColors();

  const [status, setStatus] = useState<Status>("working");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const confirm = async () => {
      if (params.error) {
        if (!cancelled) {
          setStatus("error");
          setMessage(
            typeof params.error_description === "string" &&
              params.error_description.length > 0
              ? decodeURIComponent(
                  params.error_description.replace(/\+/g, " "),
                )
              : "The confirmation link is invalid or has expired.",
          );
        }
        return;
      }

      const code =
        typeof params.code === "string" ? params.code : "";

      if (code) {
        const { error } =
          await supabase.auth.exchangeCodeForSession(code);

        if (!cancelled) {
          if (error) {
            setStatus("error");
            setMessage(error.message);
          } else {
            setStatus("success");
            setMessage(
              "Your email is confirmed. You can now sign in.",
            );
          }
        }
        return;
      }

      const tokenHash =
        typeof params.token_hash === "string"
          ? params.token_hash
          : "";

      const type =
        typeof params.type === "string" ? params.type : "";

      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as "signup",
        });

        if (!cancelled) {
          if (error) {
            setStatus("error");
            setMessage(error.message);
          } else {
            setStatus("success");
            setMessage(
              "Your email is confirmed. You can now sign in.",
            );
          }
        }
        return;
      }

      if (!cancelled) {
        setStatus("error");
        setMessage(
          "This confirmation link is missing its code. Please request a new confirmation email.",
        );
      }
    };

    void confirm();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <AuthLogo />

        <AuthHeader
          title="Email Confirmation"
          subtitle="Confirming your AdlaWatt account email."
        />

        {status === "working" && (
          <ActivityIndicator
            size="large"
            color={colors.accentContent}
          />
        )}

        {status !== "working" && (
          <View style={styles.form}>
            {status === "error" && (
              <AuthWarning message={message} />
            )}

            {status === "success" && (
              <AppText style={styles.success}>
                {message}
              </AppText>
            )}

            <AppButton
              title={
                status === "success"
                  ? "Continue to Sign In"
                  : "Back to Sign In"
              }
              onPress={() => router.replace(Routes.LOGIN)}
            />
          </View>
        )}

        <AuthFooter
          prompt="Need a new account?"
          actionLabel="Create Account"
          onAction={() => router.replace(Routes.REGISTER)}
        />

        <Copyright />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-start",
  },

  form: {
    width: "100%",
  },

  success: {
    textAlign: "center",
    marginBottom: 16,
  },
});
