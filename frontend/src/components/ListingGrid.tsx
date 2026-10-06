import { ListingCard } from "@/components/ListingCard";
import type { ListingCard as ListingCardType } from "@/types";

export function ListingGrid({ listings }: { listings: ListingCardType[] }) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {listings.map((listing, i) => (
        <ListingCard key={listing.id} listing={listing} priority={i < 5} />
      ))}
    </div>
  );
}

export function ListingGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <div className="skeleton aspect-square w-full rounded-xl" />
          <div className="mt-3 space-y-2">
            <div className="skeleton h-4 w-3/4 rounded" />
            <div className="skeleton h-4 w-1/2 rounded" />
            <div className="skeleton h-4 w-1/3 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
