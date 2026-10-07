"use client";

import { ChevronLeft, MapPin, Navigation } from "lucide-react";
import { SafeImage as Image } from "@/components/SafeImage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

import { PropertyMap } from "@/components/map/PropertyMap";
import { StartMessageButton } from "@/components/messaging/StartMessageButton";
import { StarRating } from "@/components/StarRating";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/cn";
import { ApiError, apiSend, fetcher } from "@/lib/api";
import { CANCELLATION_POLICY } from "@/lib/constants";
import { formatDateRange, formatPrice, toISODate } from "@/lib/format";
import type { ConversationDetail, TripDetail } from "@/types";

function directionsUrl(trip: TripDetail): string {
  const destination =
    trip.latitude != null && trip.longitude != null
      ? `${trip.latitude},${trip.longitude}`
      : (trip.exact_address ?? "");
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

export function ReservationDetailClient({ id }: { id: number }) {
  const { data: trip, error, mutate } = useSWR<TripDetail>(`/api/bookings/${id}`, fetcher);
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);

  if (error) {
    return (
      <Container className="py-16 text-center">
        <h1 className="text-2xl font-semibold">Reservation not found</h1>
        <p className="mt-2 text-ink-muted">This reservation doesn&apos;t exist or isn&apos;t yours.</p>
        <Link href="/trips" className="btn-primary mt-6 inline-flex">Back to trips</Link>
      </Container>
    );
  }
  if (!trip) {
    return (
      <Container className="max-w-[820px] py-10">
        <div className="skeleton h-64 w-full rounded-2xl" />
      </Container>
    );
  }

  const isGuest = trip.viewer_role === "guest";
  const isHost = trip.viewer_role === "host";
  const future = trip.check_in > toISODate(new Date());
  const canCancel = isGuest && trip.status === "confirmed" && future;
  const counterparty = isGuest ? trip.host : trip.guest;

  const cancel = async () => {
    setCancelling(true);
    try {
      await apiSend(`/api/bookings/${trip.id}/cancel`, "POST");
      toast.success("Reservation cancelled");
      await mutate();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't cancel this reservation");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <Container className="max-w-[820px] py-8">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1 text-sm font-medium hover:underline"
      >
        <ChevronLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex items-center justify-between gap-3">
        <h1 className="text-[26px] font-semibold">Reservation</h1>
        <StatusBadge status={trip.status} />
      </div>

      <Link
        href={`/listings/${trip.listing.id}`}
        className="mt-5 flex flex-col gap-4 rounded-2xl border border-divider p-4 transition hover:shadow-soft sm:flex-row sm:items-center"
      >
        <div className="relative h-40 w-full flex-shrink-0 overflow-hidden rounded-xl bg-divider sm:h-24 sm:w-32">
          {trip.listing.images[0] && (
            <Image src={trip.listing.images[0].url} alt={trip.listing.title} fill sizes="128px" className="object-cover" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-ink-muted">
            {trip.listing.city}, {trip.listing.country}
          </p>
          <p className="truncate text-lg font-semibold">{trip.listing.title}</p>
          <StarRating rating={trip.listing.rating} reviewCount={trip.listing.review_count} showCount className="mt-1" />
        </div>
      </Link>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Detail label="Confirmation code" value={<span className="font-mono">{trip.confirmation_code}</span>} />
        <Detail label={isGuest ? "Host" : "Guest"} value={counterparty.name} />
        <Detail label="Dates" value={`${formatDateRange(trip.check_in, trip.check_out)} · ${trip.nights} ${trip.nights === 1 ? "night" : "nights"}`} />
        <Detail label="Guests" value={`${trip.guest_count} ${trip.guest_count === 1 ? "guest" : "guests"}`} />
      </div>

      {/* Exact address + map + directions — only for confirmed reservations. */}
      {trip.exact_address && (
        <div className="mt-6 rounded-2xl border border-divider p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <MapPin className="h-4 w-4" /> Getting there
          </h2>
          <p className="mt-2 text-ink">{trip.exact_address}</p>
          {trip.latitude != null && trip.longitude != null && (
            <PropertyMap
              latitude={trip.latitude}
              longitude={trip.longitude}
              exact
              className="mt-4 h-[260px]"
            />
          )}
          <a
            href={directionsUrl(trip)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary mt-3 inline-flex"
          >
            <Navigation className="mr-2 h-4 w-4" /> Get directions
          </a>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-divider p-5">
        <h2 className="mb-3 font-semibold">Price details</h2>
        <div className="space-y-2.5 text-sm">
          <Line label={`${formatPrice(trip.nightly_rate_snapshot_cents)} × ${trip.night_count} nights`} value={formatPrice(trip.nightly_rate_snapshot_cents * trip.night_count)} />
          <Line label="Cleaning fee" value={formatPrice(trip.cleaning_fee_cents)} />
          <Line label="Service fee" value={formatPrice(trip.service_fee_cents)} />
          <Line label="Taxes" value={formatPrice(trip.taxes_cents)} />
          <div className="flex justify-between border-t border-divider pt-2.5 text-base font-semibold">
            <span>Total</span>
            <span>{formatPrice(trip.total_cents)}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-divider p-5">
        <h2 className="font-semibold">{CANCELLATION_POLICY.title}</h2>
        <p className="mt-1 text-sm text-ink-muted">{CANCELLATION_POLICY.summary}</p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <StartMessageButton
          label={isGuest ? "Message host" : "Message guest"}
          modalTitle={`Message ${counterparty.name}`}
          placeholder={`Hi ${counterparty.name}…`}
          onSend={(body) =>
            apiSend<ConversationDetail>(`/api/bookings/${trip.id}/message`, "POST", { body }).then((c) => c.id)
          }
        />
        {canCancel && (
          <button
            type="button"
            onClick={cancel}
            disabled={cancelling}
            className="rounded-lg border border-hairline px-5 py-3 font-semibold transition hover:border-ink disabled:opacity-50"
          >
            {cancelling ? "Cancelling…" : "Cancel reservation"}
          </button>
        )}
        {isHost && (
          <span className="text-sm text-ink-muted">Guest contact details stay private until needed.</span>
        )}
      </div>
    </Container>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-0.5 font-medium">{value}</p>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: TripDetail["status"] }) {
  const styles: Record<TripDetail["status"], string> = {
    confirmed: "bg-green-100 text-green-800",
    pending: "bg-amber-100 text-amber-800",
    cancelled: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={cn("rounded-full px-3 py-1 text-xs font-semibold capitalize", styles[status])}>
      {status}
    </span>
  );
}
