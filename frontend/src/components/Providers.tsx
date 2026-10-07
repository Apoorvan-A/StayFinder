"use client";

import { Toaster } from "sonner";
import { SWRConfig } from "swr";

import { AuthModal } from "@/components/auth/AuthModal";
import { AuthProvider } from "@/hooks/useAuth";
import { ConciergeProvider } from "@/hooks/useConcierge";
import { FavoritesProvider } from "@/hooks/useFavorites";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{ revalidateOnFocus: false, shouldRetryOnError: false }}>
      <AuthProvider>
        <FavoritesProvider>
          <ConciergeProvider>{children}</ConciergeProvider>
          <AuthModal />
          <Toaster
            position="top-center"
            toastOptions={{
              style: { borderRadius: "12px", fontFamily: "var(--font-sans)" },
            }}
          />
        </FavoritesProvider>
      </AuthProvider>
    </SWRConfig>
  );
}
