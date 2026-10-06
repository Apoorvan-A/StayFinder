"use client";

import { Share } from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";

import { FavoriteButton } from "@/components/FavoriteButton";
import { StarRating } from "@/components/StarRating";
import { Container } from "@/components/ui/Container";
import { ListingGallery } from "@/components/listing/ListingGallery";
import {
  AmenitiesSection,
  HostSection,
  MapSection,
  Overview,
  ReviewsSection,
} from "@/components/listing/ListingSections";
import { ReservationWidget } from "@/components/listing/ReservationWidget";
import { ApiError, fetcher } from "@/lib/api";
import type { Availability, ListingDetail } from "@/types";
import { DetailSkeleton } from "@/components/listing/DetailSkeleton";

export function ListingDetailClient({ id }: { id: number }) {
  const { data: listing, error } = useSWR<ListingDetail>(`/api/listings/${id}`, fetcher);
  const { data: availability } = useSWR<Availability>(`/api/listings/${id}/availability`, fetcher);

  if (error) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <Container className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <h1 className="text-2xl font-semibold">
          {notFound ? "This listing isn't available" : "Something went wrong"}
        </h1>
        <p className="text-ink-muted">
          {notFound
            ? "It may have been removed by the host."
            : "We couldn't load this listing. Please try again."}
        </p>
      </Container>
    );
  }

  if (!listing) return <DetailSkeleton />;

  const share = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  return (
    <Container className="py-6">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-semibold md:text-[26px]">{listing.title}</h1>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm">
            <StarRating rating={listing.rating} reviewCount={listing.review_count} showCount />
            <span className="text-ink-muted">·</span>
            <span className="font-medium underline">
              {listing.city}, {listing.country}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={share}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium underline hover:bg-surface"
            >
              <Share className="h-4 w-4" /> Share
            </button>
            <FavoriteButton listing={listing} variant="plain" />
          </div>
        </div>
      </div>

      <ListingGallery images={listing.images} title={listing.title} />

      <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          <Overview listing={listing} />
          <div className="h-px bg-divider" />
          <section>
            <h2 className="mb-3 text-2xl font-semibold">About this place</h2>
            <p className="whitespace-pre-line leading-relaxed text-ink">{listing.description}</p>
          </section>
          <div className="h-px bg-divider" />
          <AmenitiesSection amenities={listing.amenities} />
          <div className="h-px bg-divider" />
          <MapSection listing={listing} />
          <div className="h-px bg-divider" />
          <ReviewsSection listingId={listing.id} />
          <div className="h-px bg-divider" />
          <HostSection listing={listing} />
        </div>

        <ReservationWidget listing={listing} bookedRanges={availability?.booked_ranges ?? []} />
      </div>
    </Container>
  );
}
