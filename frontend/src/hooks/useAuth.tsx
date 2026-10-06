"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import useSWR, { useSWRConfig } from "swr";

import { apiSend, fetchMeOrNull, fetcher } from "@/lib/api";
import type { AccountUser, Role } from "@/types";

interface AuthConfig {
  google_client_id: string;
}

interface AuthContextValue {
  user: AccountUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  googleClientId: string;
  loginDemo: (role: Role) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  becomeHost: () => Promise<AccountUser>;
  /** Run `action` if signed in, otherwise open the auth modal and run it after login. */
  requireAuth: (action: () => void) => void;
  authModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { mutate } = useSWRConfig();
  const { data: user, isLoading, mutate: mutateMe } = useSWR<AccountUser | null>(
    "/api/auth/me",
    fetchMeOrNull,
  );
  const { data: config } = useSWR<AuthConfig>("/api/auth/config", fetcher);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const pendingAction = useRef<(() => void) | null>(null);

  const revalidateAll = useCallback(() => {
    // Refresh identity-dependent data (favorites, trips, host) after an auth change.
    return mutate(() => true, undefined, { revalidate: true });
  }, [mutate]);

  const afterLogin = useCallback(
    async (nextUser: AccountUser) => {
      await mutateMe(nextUser, { revalidate: false });
      await revalidateAll();
      setAuthModalOpen(false);
      if (pendingAction.current) {
        const action = pendingAction.current;
        pendingAction.current = null;
        action();
      }
    },
    [mutateMe, revalidateAll],
  );

  const loginDemo = useCallback(
    async (role: Role) => {
      const next = await apiSend<AccountUser>("/api/auth/demo", "POST", { role });
      await afterLogin(next);
    },
    [afterLogin],
  );

  const loginWithGoogle = useCallback(
    async (credential: string) => {
      const next = await apiSend<AccountUser>("/api/auth/google", "POST", { credential });
      await afterLogin(next);
    },
    [afterLogin],
  );

  const logout = useCallback(async () => {
    await apiSend("/api/auth/logout", "POST");
    await mutateMe(null, { revalidate: false });
    await revalidateAll();
  }, [mutateMe, revalidateAll]);

  const becomeHost = useCallback(async () => {
    const next = await apiSend<AccountUser>("/api/auth/become-host", "POST");
    await mutateMe(next, { revalidate: false });
    return next;
  }, [mutateMe]);

  const requireAuth = useCallback(
    (action: () => void) => {
      if (user) {
        action();
      } else {
        pendingAction.current = action;
        setAuthModalOpen(true);
      }
    },
    [user],
  );

  const value: AuthContextValue = {
    user: user ?? null,
    isLoading,
    isAuthenticated: Boolean(user),
    googleClientId: config?.google_client_id ?? "",
    loginDemo,
    loginWithGoogle,
    logout,
    becomeHost,
    requireAuth,
    authModalOpen,
    openAuthModal: () => setAuthModalOpen(true),
    closeAuthModal: () => {
      pendingAction.current = null;
      setAuthModalOpen(false);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
