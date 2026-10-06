"use client";

import { Luggage } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

import { EmptyState } from "@/components/EmptyState";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/cn";
import { apiSend, fetcher } from "@/lib/api";
import { formatDateRange, formatPrice, toISODate } from "@/lib/format";
import type { Trip } from "@/types";

type TabKey = "upcoming" | "past" | "cancelled";

export function TripsClient() {
  const { data: trips, isLoading, mutate } = useSWR<Trip[]>("/api/trips", fetcher);
  const [tab, setTab] = useState<TabKey>("upcoming");
  const [cancelling, setCancelling] = useState<number | null>(null);

  const today = toISODate(new Date());

  const groups: Record<TabKey, Trip[]> = {
    upcoming: [],
    past: [],
    cancelled: [],
  };
  (trips ?? []).forEach((trip) => {
    if (trip.status === "cancelled") groups.cancelled.push(trip);
    else if (trip.check_out >= today) groups.upcoming.push(trip);
    else groups.past.push(trip);
  });
  // Upcoming sorted soonest-first.
  groups.upcoming.sort((a, b) => a.check_in.localeCompare(b.check_in));

  const cancel = async (trip: Trip) => {
    setCancelling(trip.id);
    try {
      await apiSend(`/api/bookings/${trip.id}/cancel`, "POST");
      toast.success("Reservation cancelled");
      await mutate();
    } catch {
      toast.error("Couldn't cancel this reservation");
    } finally {
      setCancelling(null);
    }
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: "upcoming", label: `Upcoming (${groups.upcoming.length})` },
    { key: "past", label: `Past (${groups.past.length})` },
    { key: "cancelled", label: `Cancelled (${groups.cancelled.length})` },
  ];

  const current = groups[tab];

  return (
    <Container className="py-8">
      <h1 className="text-3xl font-semibold">Trips</h1>

      <div className="mt-6 flex gap-6 border-b border-divider">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "border-b-2 pb-3 text-sm font-medium transition",
              tab === t.key ? "border-ink text-ink" : "border-transparent text-ink-muted hover:text-ink",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-40 w-full rounded-2xl" />
            ))}
          </div>
        ) : current.length === 0 ? (
          <EmptyState
            icon={Luggage}
            title={`No ${tab} trips`}
            subtitle={
              tab === "upcoming"
                ? "Time to dust off your bags and start planning your next adventure."
                : `You have no ${tab} reservations.`
            }
            cta={tab === "upcoming" ? { href: "/", label: "Start searching" } : undefined}
          />
        ) : (
          <div className="space-y-5">
            {current.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onCancel={tab === "upcoming" ? () => cancel(trip) : undefined}
                cancelling={cancelling === trip.id}
              />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}

function TripCard({
  trip,
  onCancel,
  cancelling,
}: {
  trip: Trip;
  onCancel?: () => void;
  cancelling: boolean;
}) {
  const image = trip.listing.images[0]?.url;
  return (
    <div className="flex flex-col gap-4 overflow-hidden rounded-2xl border border-divider sm:flex-row">
      <Link href={`/listings/${trip.listing.id}`} className="relative h-48 w-full flex-shrink-0 bg-divider sm:h-auto sm:w-64">
        {image && <Image src={image} alt={trip.listing.title} fill sizes="256px" className="object-cover" />}
      </Link>
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-ink-muted">
                {trip.listing.city}, {trip.listing.country}
              </p>
              <Link href={`/listings/${trip.listing.id}`} className="text-lg font-semibold hover:underline">
                {trip.listing.title}
              </Link>
            </div>
            <StatusBadge status={trip.status} />
          </div>
          <p className="mt-2 text-sm text-ink">
            {formatDateRange(trip.check_in, trip.check_out)} · {trip.guest_count}{" "}
            {trip.guest_count === 1 ? "guest" : "guests"}
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            Confirmation <span className="font-mono font-medium text-ink">{trip.confirmation_code}</span>
          </p>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="font-semibold">{formatPrice(trip.total_cents)} total</p>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={cancelling}
              className="rounded-lg border border-hairline px-4 py-2 text-sm font-medium transition hover:border-ink disabled:opacity-50"
            >
              {cancelling ? "Cancelling…" : "Cancel"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Trip["status"] }) {
  const styles: Record<Trip["status"], string> = {
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
