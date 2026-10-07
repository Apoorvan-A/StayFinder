"use client";

import { createContext, useContext, useState } from "react";

import { ConciergeLauncher } from "@/components/concierge/ConciergeLauncher";
import { ConciergePanel } from "@/components/concierge/ConciergePanel";

interface ConciergeContextValue {
  open: boolean;
  openPanel: () => void;
  closePanel: () => void;
}

const ConciergeContext = createContext<ConciergeContextValue | null>(null);

export function ConciergeProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <ConciergeContext.Provider
      value={{ open, openPanel: () => setOpen(true), closePanel: () => setOpen(false) }}
    >
      {children}
      <ConciergeLauncher />
      <ConciergePanel />
    </ConciergeContext.Provider>
  );
}

export function useConcierge(): ConciergeContextValue {
  const ctx = useContext(ConciergeContext);
  if (!ctx) throw new Error("useConcierge must be used within ConciergeProvider");
  return ctx;
}
