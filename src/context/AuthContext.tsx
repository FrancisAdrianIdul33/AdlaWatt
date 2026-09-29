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
      (_event, nextSession) => {
        if (mounted) {
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
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isLoaded,
      isSignedIn: session !== null,
      refresh,
      signOut,
    }),
    [session, isLoaded, refresh, signOut],
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
