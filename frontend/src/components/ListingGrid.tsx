import { ListingCard } from "@/components/ListingCard";
import type { ListingCard as ListingCardType } from "@/types";

const GRID_COLS =
  "grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6";

export function ListingGrid({ listings }: { listings: ListingCardType[] }) {
  return (
    <div className={GRID_COLS}>
      {listings.map((listing, i) => (
        <ListingCard key={listing.id} listing={listing} priority={i < 6} />
      ))}
    </div>
  );
}

export function ListingGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className={GRID_COLS}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <div className="skeleton aspect-square w-full rounded-xl" />
          <div className="mt-3 space-y-2">
            <div className="skeleton h-3.5 w-3/4 rounded" />
            <div className="skeleton h-3.5 w-1/2 rounded" />
            <div className="skeleton h-3.5 w-1/4 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
