"use client";

import { Heart } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/cn";
import { useDemoUser } from "@/hooks/useDemoUser";
import { useFavorites } from "@/hooks/useFavorites";
import type { ListingCard } from "@/types";
import { toast } from "sonner";

export function FavoriteButton({
  listing,
  variant = "overlay",
}: {
  listing: ListingCard;
  variant?: "overlay" | "plain";
}) {
  const { isFavorited, toggle } = useFavorites();
  const { currentUserId } = useDemoUser();
  const [animating, setAnimating] = useState(false);
  const active = isFavorited(listing.id);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUserId) {
      toast.error("Select a demo user to save listings.");
      return;
    }
    setAnimating(true);
    void toggle(listing);
    window.setTimeout(() => setAnimating(false), 250);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={active ? "Remove from wishlist" : "Save to wishlist"}
      aria-pressed={active}
      className={cn(
        "grid place-items-center rounded-full transition",
        variant === "overlay" && "h-8 w-8 hover:scale-110",
        variant === "plain" && "h-10 w-10 hover:bg-surface",
      )}
    >
      <Heart
        className={cn(
          "h-6 w-6 transition-colors",
          animating && "animate-pop",
          active
            ? "fill-brand text-brand"
            : variant === "overlay"
              ? "fill-black/50 text-white"
              : "fill-transparent text-ink",
        )}
      />
    </button>
  );
}
