"use client";

import { Sparkles } from "lucide-react";

import { useConcierge } from "@/hooks/useConcierge";

export function ConciergeLauncher() {
  const { open, openPanel } = useConcierge();
  if (open) return null;
  return (
    <button
      type="button"
      onClick={openPanel}
      // Desktop only — on mobile the concierge opens from the account menu, so it never
      // collides with the bottom navigation or the sticky reservation bar.
      className="fixed bottom-6 right-6 z-40 hidden items-center gap-2 rounded-full bg-ink px-5 py-3.5 text-sm font-semibold text-white shadow-card transition hover:bg-black lg:flex"
      aria-label="Open the StayFinder AI concierge"
    >
      <Sparkles className="h-4 w-4" />
      Ask StayFinder
    </button>
  );
}
