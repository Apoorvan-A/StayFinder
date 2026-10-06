"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import useSWR, { useSWRConfig } from "swr";

import { fetcher, getStoredUserId, setStoredUserId } from "@/lib/api";
import type { User } from "@/types";

interface DemoUserContextValue {
  users: User[];
  currentUser: User | null;
  currentUserId: number | null;
  ready: boolean;
  setUser: (id: number) => void;
}

const DemoUserContext = createContext<DemoUserContextValue | null>(null);

export function DemoUserProvider({ children }: { children: React.ReactNode }) {
  const { data: users } = useSWR<User[]>("/api/users/demo", fetcher);
  const { mutate } = useSWRConfig();
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  // Initialise from storage, defaulting to the first demo identity once users load.
  useEffect(() => {
    const stored = getStoredUserId();
    if (stored) {
      setCurrentUserId(stored);
      setReady(true);
    } else if (users && users.length > 0) {
      setCurrentUserId(users[0].id);
      setStoredUserId(users[0].id);
      setReady(true);
    }
  }, [users]);

  const setUser = useCallback(
    (id: number) => {
      setStoredUserId(id);
      setCurrentUserId(id);
      // Re-fetch every identity-dependent resource with the new demo user.
      mutate(() => true, undefined, { revalidate: true });
    },
    [mutate],
  );

  const currentUser = users?.find((u) => u.id === currentUserId) ?? null;

  return (
    <DemoUserContext.Provider
      value={{ users: users ?? [], currentUser, currentUserId, ready, setUser }}
    >
      {children}
    </DemoUserContext.Provider>
  );
}

export function useDemoUser(): DemoUserContextValue {
  const ctx = useContext(DemoUserContext);
  if (!ctx) throw new Error("useDemoUser must be used within DemoUserProvider");
  return ctx;
}
