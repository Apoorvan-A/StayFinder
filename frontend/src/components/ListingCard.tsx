"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { SafeImage as Image } from "@/components/SafeImage";
import Link from "next/link";
import { useState } from "react";

import { FavoriteButton } from "@/components/FavoriteButton";
import { StarRating } from "@/components/StarRating";
import { cn } from "@/lib/cn";
import { formatNightlyPrice } from "@/lib/format";
import type { ListingCard as ListingCardType } from "@/types";

const FALLBACK =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600'><rect width='100%' height='100%' fill='#EBEBEB'/></svg>`,
  );

export function ListingCard({ listing, priority = false }: { listing: ListingCardType; priority?: boolean }) {
  const images = listing.images.length > 0 ? listing.images : [{ id: 0, url: FALLBACK, alt_text: listing.title, sort_order: 0 }];
  const [index, setIndex] = useState(0);
  const atStart = index === 0;
  const atEnd = index === images.length - 1;

  const go = (e: React.MouseEvent, delta: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => Math.min(images.length - 1, Math.max(0, i + delta)));
  };

  return (
    <Link href={`/listings/${listing.id}`} className="group block">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-divider">
        <Image
          src={images[index].url}
          alt={images[index].alt_text || listing.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          priority={priority}
          className="object-cover transition duration-300 group-hover:scale-105"
        />

        <div className="absolute right-3 top-3">
          <FavoriteButton listing={listing} />
        </div>

        {listing.is_guest_favorite && (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-ink shadow-soft">
            Guest favorite
          </span>
        )}

        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={(e) => go(e, -1)}
              className={cn(
                "absolute left-2 top-1/2 hidden h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-soft transition hover:scale-110 group-hover:grid",
                atStart && "opacity-0",
              )}
            >
              <ChevronLeft className="h-4 w-4 text-ink" />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={(e) => go(e, 1)}
              className={cn(
                "absolute right-2 top-1/2 hidden h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-soft transition hover:scale-110 group-hover:grid",
                atEnd && "opacity-0",
              )}
            >
              <ChevronRight className="h-4 w-4 text-ink" />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {images.slice(0, 5).map((img, i) => (
                <span
                  key={img.id}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full bg-white transition",
                    i === index ? "opacity-100" : "opacity-60",
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="mt-2.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-[15px] font-medium leading-tight text-ink">
            {listing.city}, {listing.country}
          </h3>
          <StarRating rating={listing.rating} className="mt-0.5 shrink-0" />
        </div>
        <p className="mt-0.5 truncate text-[15px] leading-tight text-ink-muted">{listing.title}</p>
        <p className="mt-1.5 text-[15px] text-ink">
          <span className="font-semibold">{formatNightlyPrice(listing.nightly_price_cents)}</span>
          <span className="font-normal"> night</span>
        </p>
      </div>
    </Link>
  );
}
