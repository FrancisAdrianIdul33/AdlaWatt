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
    code?: string | string[];
    token_hash?: string | string[];
    type?: string | string[];
    error?: string | string[];
    error_code?: string | string[];
    error_description?: string | string[];
  }>();

  const colors = useAppColors();

  const [status, setStatus] = useState<Status>("working");
  const [message, setMessage] = useState("");
  // True when the link carried no code at all (wrong/old
  // email, or params lost in transit). Offers a direct
  // recovery shortcut instead of a dead end.
  const [isMissingCode, setIsMissingCode] = useState(false);

  const firstParam = (
    value: string | string[] | undefined,
  ): string => {
    if (typeof value === "string") {
      return value;
    }

    if (Array.isArray(value) && value.length > 0) {
      return value[0] ?? "";
    }

    return "";
  };

  const decodeParam = (value: string): string => {
    try {
      return decodeURIComponent(value.replace(/\+/g, " "));
    } catch {
      return value;
    }
  };

  const code = firstParam(params.code);
  const tokenHash = firstParam(params.token_hash);
  const otpType = firstParam(params.type);
  const linkError =
    firstParam(params.error) || firstParam(params.error_code);
  const linkErrorDescription = firstParam(
    params.error_description,
  );

  // Recovery links sign the user in with a PASSWORD_RECOVERY
  // event (both PKCE-code and token-hash flows). Catch it and
  // hand the flow to /auth/forgot-password instead of the
  // dashboard — the AuthContext flag exempts that screen
  // from the signed-in bounce in the auth layout.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        router.replace(
          `${Routes.FORGOT_PASSWORD}?verified=1`,
        );
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const confirm = async () => {
      setStatus("working");
      setMessage("");

      if (linkError) {
        if (!cancelled) {
          setStatus("error");
          setMessage(
            linkErrorDescription
              ? decodeParam(linkErrorDescription)
              : "The confirmation link is invalid or has expired.",
          );
        }
        return;
      }

      if (code) {
        const { error } =
          await supabase.auth.exchangeCodeForSession(code);

        if (!cancelled) {
          if (error) {
            setStatus("error");
            setMessage(
              "This confirmation link is invalid or has expired. Request a new one from the sign-in screen.",
            );
          } else {
            // The auth layout notices the new session and
            // routes to the dashboard on its own.
            setStatus("success");
            setMessage(
              "Your email is confirmed. Taking you to your dashboard.",
            );
          }
        }
        return;
      }

      if (tokenHash && otpType) {
        const allowedTypes = [
          "signup",
          "invite",
          "magiclink",
          "recovery",
          "email_change",
        ] as const;

        type OtpType = (typeof allowedTypes)[number];

        const verifiedType: OtpType = (
          allowedTypes as readonly string[]
        ).includes(otpType)
          ? (otpType as OtpType)
          : "signup";

        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: verifiedType,
        });

        if (!cancelled) {
          if (error) {
            setStatus("error");
            setMessage(
              "This confirmation link is invalid or has expired. Request a new one from the sign-in screen.",
            );
          } else if (verifiedType === "recovery") {
            // The PASSWORD_RECOVERY listener above usually
            // beats us here; this covers the case where the
            // event was already consumed before we mounted.
            router.replace(
              `${Routes.FORGOT_PASSWORD}?verified=1`,
            );
          } else {
            setStatus("success");
            setMessage(
              "Your email is confirmed. Taking you to your dashboard.",
            );
          }
        }
        return;
      }

      if (!cancelled) {
        setStatus("error");
        setIsMissingCode(true);
        setMessage(
          "This link arrived without its verification code. If you were resetting your password, request a fresh recovery link — otherwise request a new confirmation email.",
        );
      }
    };

    void confirm();

    return () => {
      cancelled = true;
    };
  }, [code, tokenHash, otpType, linkError, linkErrorDescription]);

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
                  ? "Continue to Dashboard"
                  : "Back to Sign In"
              }
              onPress={() =>
                router.replace(
                  status === "success"
                    ? Routes.DASHBOARD
                    : Routes.LOGIN,
                )
              }
            />

            {status === "error" && isMissingCode && (
              <AppButton
                title="Go to Reset Password"
                onPress={() =>
                  router.replace(Routes.FORGOT_PASSWORD)
                }
              />
            )}
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
