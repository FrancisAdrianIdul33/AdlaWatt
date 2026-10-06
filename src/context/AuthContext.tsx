import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

// ============================================================
// AUTH CONTEXT
// ============================================================
//
// Single source of truth for the signed-in session.
// Bootstraps from persisted storage on mount, then follows
// onAuthStateChange (sign-in, sign-out, token refresh,
// email confirmation). Screens and layouts consume
// useAuth() instead of calling getSession() ad hoc so
// session restores survive cold starts and guards agree.
// ============================================================

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  // True between a PASSWORD_RECOVERY event and the password
  // actually being updated (or sign-out). Lets the auth
  // layout exempt /auth/forgot-password from its usual
  // signed-in bounce so the user can set the new password.
  isRecoverySession: boolean;
  clearRecoverySession: () => void;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext =
  createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] =
    useState<Session | null>(null);

  const [isLoaded, setIsLoaded] =
    useState(false);

  const [isRecoverySession, setIsRecoverySession] =
    useState(false);

  const clearRecoverySession = useCallback(() => {
    setIsRecoverySession(false);
  }, []);

  const refresh = useCallback(async () => {
    const {
      data: { session: current },
    } = await supabase.auth.getSession();

    setSession(current);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data: { session: current } }) => {
        if (mounted) {
          setSession(current);
          setIsLoaded(true);
        }
      })
      .catch(() => {
        if (mounted) {
          setIsLoaded(true);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        if (mounted) {
          if (event === "PASSWORD_RECOVERY") {
            setIsRecoverySession(true);
          } else if (event === "SIGNED_OUT") {
            setIsRecoverySession(false);
          }

          setSession(nextSession);
          setIsLoaded(true);
        }
      },
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setIsRecoverySession(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isLoaded,
      isSignedIn: session !== null,
      isRecoverySession,
      clearRecoverySession,
      refresh,
      signOut,
    }),
    [
      session,
      isLoaded,
      isRecoverySession,
      clearRecoverySession,
      refresh,
      signOut,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within AuthProvider.",
    );
  }

  return context;
}
