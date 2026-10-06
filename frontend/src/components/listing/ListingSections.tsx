"use client";

import { Award, Star } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import useSWR from "swr";

import { StarRating } from "@/components/StarRating";
import { Modal } from "@/components/ui/Modal";
import { fetcher } from "@/lib/api";
import { formatShortDate } from "@/lib/format";
import { resolveIcon } from "@/lib/icons";
import type { Amenity, ListingDetail, ReviewSummary } from "@/types";

export function Overview({ listing }: { listing: ListingDetail }) {
  const specs = [
    `${listing.max_guests} guests`,
    `${listing.bedrooms} ${listing.bedrooms === 1 ? "bedroom" : "bedrooms"}`,
    `${listing.beds} ${listing.beds === 1 ? "bed" : "beds"}`,
    `${listing.bathrooms} ${listing.bathrooms === 1 ? "bath" : "baths"}`,
  ];
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold">
          {listing.property_type} hosted by {listing.host.name}
        </h2>
        <p className="text-ink-muted">{specs.join(" · ")}</p>
      </div>
      {listing.host.avatar_url && (
        <Image
          src={listing.host.avatar_url}
          alt={listing.host.name}
          width={56}
          height={56}
          className="h-14 w-14 rounded-full object-cover"
        />
      )}
    </div>
  );
}

export function AmenitiesSection({ amenities }: { amenities: Amenity[] }) {
  const [open, setOpen] = useState(false);
  const preview = amenities.slice(0, 10);
  return (
    <section>
      <h2 className="mb-5 text-2xl font-semibold">What this place offers</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {preview.map((a) => {
          const Icon = resolveIcon(a.icon);
          return (
            <div key={a.id} className="flex items-center gap-4 py-1">
              <Icon className="h-6 w-6 text-ink" />
              <span>{a.name}</span>
            </div>
          );
        })}
      </div>
      {amenities.length > 10 && (
        <button type="button" onClick={() => setOpen(true)} className="btn-secondary mt-6">
          Show all {amenities.length} amenities
        </button>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="What this place offers" size="lg">
        <div className="space-y-4">
          {amenities.map((a) => {
            const Icon = resolveIcon(a.icon);
            return (
              <div key={a.id} className="flex items-center gap-4 border-b border-divider py-3 last:border-0">
                <Icon className="h-6 w-6 text-ink" />
                <span>{a.name}</span>
              </div>
            );
          })}
        </div>
      </Modal>
    </section>
  );
}

export function HostSection({ listing }: { listing: ListingDetail }) {
  const host = listing.host;
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-divider p-6 sm:flex-row sm:items-center">
      <div className="flex items-center gap-4">
        {host.avatar_url && (
          <Image src={host.avatar_url} alt={host.name} width={64} height={64} className="h-16 w-16 rounded-full object-cover" />
        )}
        <div>
          <h3 className="text-lg font-semibold">Hosted by {host.name}</h3>
          {host.is_superhost && (
            <p className="flex items-center gap-1 text-sm text-ink-muted">
              <Award className="h-4 w-4" /> Superhost
            </p>
          )}
        </div>
      </div>
      {host.bio && <p className="text-ink-muted sm:border-l sm:border-divider sm:pl-6">{host.bio}</p>}
    </section>
  );
}

export function ReviewsSection({ listingId }: { listingId: number }) {
  const { data } = useSWR<ReviewSummary>(`/api/listings/${listingId}/reviews`, fetcher);
  const [showAll, setShowAll] = useState(false);

  if (!data) {
    return <div className="skeleton h-40 w-full rounded-xl" />;
  }
  if (data.review_count === 0) {
    return (
      <section>
        <h2 className="mb-2 text-2xl font-semibold">Reviews</h2>
        <p className="text-ink-muted">No reviews yet — be the first to stay here.</p>
      </section>
    );
  }

  const visible = showAll ? data.reviews : data.reviews.slice(0, 6);

  return (
    <section>
      <h2 className="mb-6 flex items-center gap-2 text-2xl font-semibold">
        <Star className="h-5 w-5 fill-ink text-ink" />
        {data.rating.toFixed(2)} · {data.review_count} reviews
      </h2>
      <div className="grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-2">
        {visible.map((review) => (
          <div key={review.id}>
            <div className="mb-2 flex items-center gap-3">
              {review.author.avatar_url && (
                <Image
                  src={review.author.avatar_url}
                  alt={review.author.name}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover"
                />
              )}
              <div>
                <p className="font-medium">{review.author.name}</p>
                <p className="text-xs text-ink-muted">{formatShortDate(review.created_at)}</p>
              </div>
            </div>
            <StarRating rating={review.rating} className="mb-1" />
            <p className="text-ink">{review.comment}</p>
          </div>
        ))}
      </div>
      {!showAll && data.reviews.length > 6 && (
        <button type="button" onClick={() => setShowAll(true)} className="btn-secondary mt-8">
          Show all {data.review_count} reviews
        </button>
      )}
    </section>
  );
}

export function MapSection({ listing }: { listing: ListingDetail }) {
  if (listing.latitude == null || listing.longitude == null) return null;
  const { latitude: lat, longitude: lng } = listing;
  const delta = 0.02;
  const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
  return (
    <section>
      <h2 className="mb-5 text-2xl font-semibold">Where you&apos;ll be</h2>
      <div className="overflow-hidden rounded-2xl border border-divider">
        <iframe
          title={`Map showing ${listing.city}`}
          src={src}
          className="h-[360px] w-full"
          loading="lazy"
        />
      </div>
      <p className="mt-3 font-medium">
        {listing.city}, {listing.country}
      </p>
    </section>
  );
}
