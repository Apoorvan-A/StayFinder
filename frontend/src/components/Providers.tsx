"use client";

import { Toaster } from "sonner";
import { SWRConfig } from "swr";

import { DemoUserProvider } from "@/hooks/useDemoUser";
import { FavoritesProvider } from "@/hooks/useFavorites";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{ revalidateOnFocus: false, shouldRetryOnError: false }}>
      <DemoUserProvider>
        <FavoritesProvider>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              style: { borderRadius: "12px", fontFamily: "var(--font-sans)" },
            }}
          />
        </FavoritesProvider>
      </DemoUserProvider>
    </SWRConfig>
  );
}
