"use client";

import { Home, Pencil, Plus, Trash2 } from "lucide-react";
import { SafeImage as Image } from "@/components/SafeImage";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

import { EmptyState } from "@/components/EmptyState";
import { StarRating } from "@/components/StarRating";
import { Modal } from "@/components/ui/Modal";
import { ApiError, apiSend, fetcher } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import type { ListingDetail } from "@/types";

export function HostListings() {
  const { data: listings, isLoading, mutate } = useSWR<ListingDetail[]>("/api/host/listings", fetcher);
  const [pendingDelete, setPendingDelete] = useState<ListingDetail | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await apiSend(`/api/host/listings/${pendingDelete.id}`, "DELETE");
      toast.success("Listing deleted");
      setPendingDelete(null);
      await mutate();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not delete listing");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Your listings</h1>
        <Link href="/host/listings/new" className="btn-primary">
          <Plus className="mr-2 h-4 w-4" /> Create
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : !listings || listings.length === 0 ? (
        <EmptyState
          icon={Home}
          title="No listings yet"
          subtitle="Create your first listing to start welcoming guests."
          cta={{ href: "/host/listings/new", label: "Create a listing" }}
        />
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => (
            <div key={listing.id} className="flex items-center gap-4 rounded-2xl border border-divider p-4">
              <Link href={`/listings/${listing.id}`} className="relative h-20 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-divider">
                {listing.images[0] && (
                  <Image src={listing.images[0].url} alt={listing.title} fill sizes="96px" className="object-cover" />
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{listing.title}</p>
                <p className="truncate text-sm text-ink-muted">
                  {listing.city}, {listing.country}
                </p>
                <div className="mt-1 flex items-center gap-3 text-sm">
                  <span className="font-medium">{formatPrice(listing.nightly_price_cents)} night</span>
                  <StarRating rating={listing.rating} reviewCount={listing.review_count} showCount />
                </div>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                <Link
                  href={`/host/listings/${listing.id}/edit`}
                  className="flex items-center gap-1 rounded-lg border border-hairline px-3 py-2 text-sm font-medium hover:border-ink"
                >
                  <Pencil className="h-4 w-4" /> <span className="hidden sm:inline">Edit</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setPendingDelete(listing)}
                  className="flex items-center gap-1 rounded-lg border border-hairline px-3 py-2 text-sm font-medium text-brand hover:border-brand"
                >
                  <Trash2 className="h-4 w-4" /> <span className="hidden sm:inline">Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title="Delete listing"
        footer={
          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={() => setPendingDelete(null)}>
              Keep listing
            </button>
            <button type="button" className="btn-primary" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        }
      >
        <p className="text-ink">
          Are you sure you want to delete <span className="font-semibold">{pendingDelete?.title}</span>?
          This also removes its bookings and reviews. This can&apos;t be undone.
        </p>
      </Modal>
    </div>
  );
}
