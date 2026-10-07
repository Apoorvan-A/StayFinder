"use client";

import { useState } from "react";

import { ListingCard } from "@/components/ListingCard";
import { ResultsMap } from "@/components/map/ResultsMap";
import { cn } from "@/lib/cn";
import type { ListingCard as ListingCardType } from "@/types";

export function MapResults({ listings }: { listings: ListingCardType[] }) {
  const [activeId, setActiveId] = useState<number | null>(null);

  const focusCard = (id: number | null) => {
    setActiveId(id);
    if (id != null) {
      document.getElementById(`map-card-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="flex gap-6">
      <div className="min-w-0 flex-1">
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
          {listings.map((listing, i) => (
            <div
              key={listing.id}
              id={`map-card-${listing.id}`}
              onMouseEnter={() => setActiveId(listing.id)}
              onMouseLeave={() => setActiveId(null)}
              className={cn(
                "rounded-xl transition",
                activeId === listing.id && "ring-2 ring-ink ring-offset-2",
              )}
            >
              <ListingCard listing={listing} priority={i < 4} />
            </div>
          ))}
        </div>
      </div>

      <div className="sticky top-36 hidden h-[calc(100vh-11rem)] w-[42%] flex-shrink-0 overflow-hidden rounded-2xl border border-divider lg:block">
        <ResultsMap listings={listings} activeId={activeId} onSelect={focusCard} />
      </div>
    </div>
  );
}
