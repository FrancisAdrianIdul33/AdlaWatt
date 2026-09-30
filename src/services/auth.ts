import { Platform } from "react-native";

import {
  getAuthenticatedUserSafe,
  isAuthSessionMissingError,
  supabase,
} from "@/lib/supabase";
import {
  logActivity,
  logAuth,
  logProfile,
} from "@/services/activityLogService";
import { Routes } from "@/constants/routes";

// ============================================================
// SHARED AUTH HELPERS
// ============================================================
//
// Single source of truth for auth validation + error mapping
// so client screens mirror these rules for instant UX while
// the service remains safe to call directly.
//
// Security notes:
// - Signup/login failures that could reveal account existence
//   ("already registered", username lookup misses) map to
//   generic messages. Username login inherently allows
//   probing via the lookup RPC; errors and timing are kept
//   uniform to minimize the oracle.
// - Resends are throttled per email (service-side) so rapid
//   taps or direct service calls cannot flood inboxes or burn
//   Supabase rate limits.
// ============================================================

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RESEND_COOLDOWN_MS = 60 * 1000;

const resendTimestamps = new Map<string, number>();

const isRateLimitMessage = (message: string): boolean => {
    const lower = message.toLowerCase();

    return (
        lower.includes("rate") ||
        lower.includes("too many") ||
        lower.includes("security") ||
        lower.includes("exceeded") ||
        lower.includes("throttle")
    );
};

const isNetworkMessage = (message: string): boolean => {
    const lower = message.toLowerCase();

    return (
        lower.includes("fetch") ||
        lower.includes("network") ||
        lower.includes("offline") ||
        lower.includes("timeout") ||
        lower.includes("unreachable")
    );
};

const isAlreadyRegisteredMessage = (message: string): boolean => {
    const lower = message.toLowerCase();

    return (
        lower.includes("already") ||
        lower.includes("registered") ||
        lower.includes("exists") ||
        lower.includes("taken") ||
        lower.includes("duplicate")
    );
};

// ============================================================
// EMAIL REDIRECT
// ============================================================
//
// Dev-only manual-login flow: we intentionally omit
// emailRedirectTo so Supabase confirms on its hosted page.
// This avoids baking http://localhost:8081 into the email,
// which is unreachable when opened on another device.
//
// getEmailRedirectTo is kept for the future auto-login flow
// (adlawatt://auth/callback + /auth/callback) but is currently
// unused.
// ============================================================

export const getEmailRedirectTo = (): string | undefined => {
    if (Platform.OS === "web") {
        if (
            typeof window !== "undefined" &&
            window.location?.origin
        ) {
            return `${window.location.origin}${Routes.AUTH_CALLBACK}`;
        }

        return undefined;
    }

    return `adlawatt:/${Routes.AUTH_CALLBACK}`;
};

export async function resendConfirmation(email: string) {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
        return {
            success: false,
            error: "Please enter your email address.",
        };
    }

    const now = Date.now();
    const lastSent = resendTimestamps.get(cleanEmail) ?? 0;

    if (now - lastSent < RESEND_COOLDOWN_MS) {
        return {
            success: false,
            throttled: true,
            error: "A confirmation email was sent recently. Please wait before requesting another.",
        };
    }

    resendTimestamps.set(cleanEmail, now);

    const { error } = await supabase.auth.resend({
        type: "signup",
        email: cleanEmail,
        // No emailRedirectTo: let Supabase confirm on its hosted
        // page so the link works from any device.
    });

    if (error) {
        return {
            success: false,
            throttled: isRateLimitMessage(error.message),
            error: error.message,
        };
    }

    return { success: true, throttled: false };
}

export async function registerUser(
    username: string,
    email: string,
    password: string,
    termsAgreed: boolean,
) {
    try {
        const cleanUsername = username.trim().toLowerCase();
        const cleanEmail = email.trim().toLowerCase();

        // Username validation
        if (!cleanUsername) {
            return {
                success: false,
                error: "Please enter a username.",
            };
        }

        if (cleanUsername.length < 3) {
            return {
                success: false,
                error: "Username must be at least 3 characters.",
            };
        }

        if (cleanUsername.length > 30) {
            return {
                success: false,
                error: "Username must not exceed 30 characters.",
            };
        }

        if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
            return {
                success: false,
                error:
                    "Username can only contain letters, numbers, and underscores.",
            };
        }

        if (!cleanEmail) {
            return {
                success: false,
                error: "Please enter your email address.",
            };
        }

        if (!EMAIL_PATTERN.test(cleanEmail)) {
            return {
                success: false,
                error: "Please enter a valid email address.",
            };
        }

        // Password validation
        if (!password || password.trim().length < 8) {
            return {
                success: false,
                error: "Password must be at least 8 characters.",
            };
        }

        if (password.length > 72) {
            return {
                success: false,
                error: "Password must not exceed 72 characters.",
            };
        }

        // Terms validation
        if (!termsAgreed) {
            return {
                success: false,
                error: "Please agree to the Terms and Conditions.",
            };
        }

        /*
         * Create the authentication account.
         *
         * Username and terms_agreed are stored temporarily
         * in Supabase Auth metadata.
         *
         * The database trigger then creates the corresponding
         * public.users profile automatically.
         */
        const { data: authData, error: authError } =
            await supabase.auth.signUp({
                email: cleanEmail,
                password,
                options: {
                    data: {
                        username: cleanUsername,
                        terms_agreed: termsAgreed,
                    },
                    // No emailRedirectTo: Supabase-hosted confirmation
                    // works from any device (no localhost dependency).
                },
            });

        if (authError) {
            console.error("Registration error:", authError.message);

            // Never reveal whether the email is taken.
            if (isAlreadyRegisteredMessage(authError.message)) {
                return {
                    success: false,
                    error: "Unable to create your account with these details. Try signing in instead.",
                };
            }

            if (isRateLimitMessage(authError.message)) {
                return {
                    success: false,
                    error: "Too many attempts. Please wait a moment and try again.",
                };
            }

            return {
                success: false,
                error: authError.message,
            };
        }

        if (!authData.user) {
            return {
                success: false,
                error: "Account could not be created.",
            };
        }

        logAuth.accountCreated(
            cleanUsername,
            authData.user.id,
        );

        // Confirm-email ON: no session until the user clicks
        // the email link. Confirm-off: session exists at once.
        if (!authData.session) {
            return {
                success: true,
                user: authData.user,
                needsConfirmation: true,
                email: cleanEmail,
            };
        }

        return {
            success: true,
            user: authData.user,
            needsConfirmation: false,
            email: cleanEmail,
        };

    } catch (error) {
        console.error("Registration error:", error);

        return {
            success: false,
            error: "Unable to create your account. Please try again.",
        };
    }
}



export async function getCurrentUserProfile() {
    try {
        const user = await getAuthenticatedUserSafe();

        if (!user) {
            return {
                success: false,
                error: "No authenticated user found.",
            };
        }

        const { data: profile, error: profileError } =
            await supabase
                .from("users")
                .select("id, username, email, terms_agreed, created_at")
                .eq("id", user.id)
                .single();

        if (profileError) {
            console.error(
                "Get user profile error:",
                profileError.message,
            );

            return {
                success: false,
                error: "Unable to load your account information.",
            };
        }

        return {
            success: true,
            user,
            userId: profile?.id ?? user.id,
            username: profile?.username ?? "",
            email: profile?.email ?? user.email ?? "",
            termsAgreed: profile?.terms_agreed ?? false,
            createdAt: profile?.created_at ?? null,
        };
    } catch (error) {
        if (isAuthSessionMissingError(error)) {
            return {
                success: false,
                error: "No authenticated user found.",
            };
        }

        console.error(
            "Get current user profile error:",
            error,
        );

        return {
            success: false,
            error:
                "Unable to load your account information.",
        };
    }
}

export async function loginUser(
    usernameOrEmail: string,
    password: string,
) {
    try {
        const identifier = usernameOrEmail.trim().toLowerCase();

        if (!identifier || !password) {
            return {
                success: false,
                error:
                    "Please enter your username or email and password.",
            };
        }

        let email = identifier;

        // Username login. Both miss and lookup-failure paths
        // return the identical message so the RPC cannot be
        // used to probe which usernames exist.
        if (!identifier.includes("@")) {
            const { data: profileEmail, error: profileError } =
                await supabase.rpc(
                    "get_email_by_username",
                    {
                        lookup_username: identifier,
                    },
                );

            if (profileError) {
                console.error(
                    "Username lookup error:",
                    profileError.message,
                );

                return {
                    success: false,
                    kind: "invalid" as const,
                    error: "The username or password is incorrect.",
                };
            }

            if (!profileEmail) {
                return {
                    success: false,
                    kind: "invalid" as const,
                    error: "The username or password is incorrect.",
                };
            }

            email = profileEmail.trim().toLowerCase();
        }

        // Supabase authentication
        const { data, error } =
            await supabase.auth.signInWithPassword({
                email,
                password,
            });

        if (error) {
            console.error("Login error:", error.message);

            if (
                error.message
                    .toLowerCase()
                    .includes("email not confirmed")
            ) {
                // Auto-send a fresh confirmation link so the
                // user does not have to tap Resend manually.
                // resendConfirmation enforces the per-email
                // cooldown; failures never override the
                // unconfirmed outcome.
                let confirmationResent:
                    | "sent"
                    | "rate-limited"
                    | "failed" = "failed";

                try {
                    const resendResult =
                        await resendConfirmation(email);

                    if (resendResult.success) {
                        confirmationResent = "sent";
                    } else if (resendResult.throttled) {
                        confirmationResent = "rate-limited";
                    } else {
                        confirmationResent = "failed";
                    }
                } catch {
                    confirmationResent = "failed";
                }

                return {
                    success: false,
                    kind: "unconfirmed" as const,
                    emailNotConfirmed: true,
                    email,
                    confirmationResent,
                    error: "Please confirm your email address before signing in. Check your inbox for the confirmation link.",
                };
            }

            if (isRateLimitMessage(error.message)) {
                return {
                    success: false,
                    kind: "rate-limited" as const,
                    error: "Too many sign-in attempts. Please wait a moment and try again.",
                };
            }

            if (isNetworkMessage(error.message)) {
                return {
                    success: false,
                    kind: "network" as const,
                    error: "No connection. Check your internet and try again.",
                };
            }

            return {
                success: false,
                kind: "invalid" as const,
                error: "The username or password is incorrect.",
            };
        }

        if (!data.user || !data.session) {
            return {
                success: false,
                kind: "invalid" as const,
                error: "Unable to create a login session.",
            };
        }

        logAuth.loggedIn(
            data.user.email ?? identifier,
        );

        return {
            success: true,
            user: data.user,
            session: data.session,
        };
    } catch (error) {
        console.error("Login error:", error);

        return {
            success: false,
            kind: "unknown" as const,
            error:
                "Unable to sign in right now. Please try again.",
        };
    }
}


export async function updateAccount(
    username: string,
    email: string,
    currentPassword: string,
    newPassword?: string,
) {
    try {
        const cleanUsername = username.trim().toLowerCase();
        const cleanEmail = email.trim().toLowerCase();
        const cleanCurrentPassword = currentPassword;

        // =========================
        // VALIDATE USERNAME
        // =========================

        if (!cleanUsername) {
            return {
                success: false,
                error: "Please enter a username.",
            };
        }

        if (cleanUsername.length < 3) {
            return {
                success: false,
                error: "Username must be at least 3 characters.",
            };
        }

        if (cleanUsername.length > 30) {
            return {
                success: false,
                error: "Username must not exceed 30 characters.",
            };
        }

        if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
            return {
                success: false,
                error:
                    "Username can only contain letters, numbers, and underscores.",
            };
        }

        // =========================
        // VALIDATE EMAIL
        // =========================

        if (!cleanEmail) {
            return {
                success: false,
                error: "Please enter your email address.",
            };
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            return {
                success: false,
                error: "Enter a valid email address.",
            };
        }

        // =========================
        // VALIDATE PASSWORD
        // =========================

        if (!cleanCurrentPassword) {
            return {
                success: false,
                error: "Please enter your current password.",
            };
        }

        if (newPassword && newPassword.length < 8) {
            return {
                success: false,
                error: "Password must be at least 8 characters.",
            };
        }

        if (newPassword && newPassword.length > 72) {
            return {
                success: false,
                error: "Password must not exceed 72 characters.",
            };
        }

        // =========================
        // GET CURRENT USER
        // =========================

        const user = await getAuthenticatedUserSafe();

        if (!user) {
            return {
                success: false,
                error: "No authenticated user found.",
            };
        }

        if (!user.email) {
            return {
                success: false,
                error: "Your account does not have an email address.",
            };
        }

        // =========================
        // VERIFY CURRENT PASSWORD
        // =========================

        const { error: verifyError } =
            await supabase.auth.signInWithPassword({
                email: user.email,
                password: cleanCurrentPassword,
            });

        if (verifyError) {
            logActivity({
                title: "Verification Failed",
                description:
                    "Incorrect current password during account update.",
                type: "warning",
            });

            return {
                success: false,
                error: "Incorrect current password.",
            };
        }

        // =========================
        // CHECK USERNAME AVAILABILITY
        // =========================

        const { data: existingUsername, error: usernameError } =
            await supabase
                .from("users")
                .select("id")
                .eq("username", cleanUsername)
                .neq("id", user.id)
                .maybeSingle();

        if (usernameError) {
            console.error(
                "Username availability error:",
                usernameError.message,
            );

            return {
                success: false,
                error: "Unable to verify username availability.",
            };
        }

        if (existingUsername) {
            return {
                success: false,
                error: "That username is already being used.",
            };
        }

        // =========================
        // CHECK EMAIL AVAILABILITY
        // =========================

        const { data: existingEmail, error: emailError } =
            await supabase
                .from("users")
                .select("id")
                .eq("email", cleanEmail)
                .neq("id", user.id)
                .maybeSingle();

        if (emailError) {
            console.error(
                "Email availability error:",
                emailError.message,
            );

            return {
                success: false,
                error: "Unable to verify email availability.",
            };
        }

        if (existingEmail) {
            return {
                success: false,
                error: "That email address is already registered.",
            };
        }

        // =========================
        // UPDATE SUPABASE AUTH
        // =========================

        const emailChanged =
            user.email?.trim().toLowerCase() !== cleanEmail;

        const passwordChanged =
            !!newPassword && newPassword.length > 0;

        if (emailChanged || passwordChanged) {
            const authUpdate: {
                email?: string;
                password?: string;
            } = {};

            if (emailChanged) {
                authUpdate.email = cleanEmail;
            }

            if (passwordChanged) {
                authUpdate.password = newPassword;
            }

            const { data: authData, error: authUpdateError } =
                await supabase.auth.updateUser(authUpdate);

            if (authUpdateError) {
                console.error(
                    "Supabase Auth update error:",
                    authUpdateError.message,
                );

                return {
                    success: false,
                    error: authUpdateError.message,
                };
            }

            // If Supabase requires email confirmation,
            // authData.user.email may still contain the old email.
            if (
                emailChanged &&
                authData.user?.email?.trim().toLowerCase() !==
                cleanEmail
            ) {
                // Username can still be updated.
                const { error: usernameUpdateError } =
                    await supabase
                        .from("users")
                        .update({
                            username: cleanUsername,
                        })
                        .eq("id", user.id);

                if (usernameUpdateError) {
                    return {
                        success: false,
                        error:
                            usernameUpdateError.message,
                    };
                }

                if (passwordChanged) {
                    logProfile.passwordChanged();
                }

                return {
                    success: true,
                    username: cleanUsername,
                    email: user.email,
                    emailChangePending: true,
                    message:
                        "Username updated. Please confirm your new email address before it becomes your login email.",
                };
            }
        }

        // =========================
        // UPDATE PUBLIC USERS TABLE
        // =========================

        const { error: profileUpdateError } =
            await supabase
                .from("users")
                .update({
                    username: cleanUsername,
                    email: cleanEmail,
                })
                .eq("id", user.id);

        if (profileUpdateError) {
            console.error(
                "Profile update error:",
                profileUpdateError.message,
            );

            return {
                success: false,
                error: profileUpdateError.message,
            };
        }

        if (passwordChanged) {
            logProfile.passwordChanged();
        }

        return {
            success: true,
            username: cleanUsername,
            email: cleanEmail,
            emailChangePending: false,
        };
    } catch (error) {
        console.error(
            "Update account error:",
            error,
        );

        return {
            success: false,
            error:
                "Unable to update your account. Please try again.",
        };
    }
}