"use client";

import useSWR from "swr";

import { ListingForm } from "@/components/host/ListingForm";
import { fetcher } from "@/lib/api";
import type { ListingDetail } from "@/types";

export function EditListingClient({ id }: { id: number }) {
  const { data: listing, error } = useSWR<ListingDetail>(`/api/listings/${id}`, fetcher);

  if (error) {
    return <p className="text-ink-muted">We couldn&apos;t load this listing.</p>;
  }
  if (!listing) {
    return <div className="skeleton h-96 w-full max-w-3xl rounded-2xl" />;
  }

  return (
    <div>
      <h1 className="mb-6 text-3xl font-semibold">Edit listing</h1>
      <ListingForm mode="edit" listing={listing} />
    </div>
  );
}
