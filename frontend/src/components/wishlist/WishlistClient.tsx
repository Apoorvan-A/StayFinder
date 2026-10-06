"use client";

import { Heart } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { ListingGrid, ListingGridSkeleton } from "@/components/ListingGrid";
import { Container } from "@/components/ui/Container";
import { useFavorites } from "@/hooks/useFavorites";

export function WishlistClient() {
  const { favorites, isLoading } = useFavorites();

  return (
    <Container className="py-8">
      <h1 className="text-3xl font-semibold">Wishlist</h1>
      <p className="mt-1 text-ink-muted">Places you&apos;ve saved for later.</p>

      <div className="mt-8">
        {isLoading ? (
          <ListingGridSkeleton count={5} />
        ) : favorites.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="No saved stays yet"
            subtitle="Tap the heart on any listing to save it here for later."
            cta={{ href: "/", label: "Explore stays" }}
          />
        ) : (
          <ListingGrid listings={favorites} />
        )}
      </div>
    </Container>
  );
}
