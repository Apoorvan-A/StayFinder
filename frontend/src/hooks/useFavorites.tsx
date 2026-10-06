"use client";

import { createContext, useContext } from "react";
import { toast } from "sonner";
import useSWR from "swr";

import { apiSend, fetcher } from "@/lib/api";
import type { ListingCard } from "@/types";
import { useDemoUser } from "@/hooks/useDemoUser";

interface FavoritesContextValue {
  favoriteIds: Set<number>;
  favorites: ListingCard[];
  isFavorited: (listingId: number) => boolean;
  toggle: (listing: ListingCard) => Promise<void>;
  isLoading: boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { currentUserId } = useDemoUser();
  const key = currentUserId ? "/api/favorites" : null;
  const { data, mutate, isLoading } = useSWR<ListingCard[]>(key, fetcher);

  const favorites = data ?? [];
  const favoriteIds = new Set(favorites.map((l) => l.id));

  const isFavorited = (listingId: number) => favoriteIds.has(listingId);

  const toggle = async (listing: ListingCard) => {
    const currentlyFav = favoriteIds.has(listing.id);
    const optimistic = currentlyFav
      ? favorites.filter((l) => l.id !== listing.id)
      : [{ ...listing, is_favorited: true }, ...favorites];

    try {
      await mutate(
        async () => {
          if (currentlyFav) {
            await apiSend(`/api/favorites/${listing.id}`, "DELETE");
          } else {
            await apiSend(`/api/favorites/${listing.id}`, "POST");
          }
          return undefined; // force revalidation from server
        },
        {
          optimisticData: optimistic,
          rollbackOnError: true,
          populateCache: false,
          revalidate: true,
        },
      );
      toast.success(currentlyFav ? "Removed from wishlist" : "Saved to wishlist");
    } catch {
      toast.error("Could not update your wishlist. Please try again.");
    }
  };

  return (
    <FavoritesContext.Provider
      value={{ favoriteIds, favorites, isFavorited, toggle, isLoading }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
