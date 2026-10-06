"use client";

import { CalendarCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import useSWR from "swr";

import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/cn";
import { fetcher } from "@/lib/api";
import { formatDateRange, formatPrice } from "@/lib/format";
import type { HostReservation } from "@/types";

export function HostReservations() {
  const { data, isLoading } = useSWR<HostReservation[]>("/api/host/reservations", fetcher);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-20 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={CalendarCheck}
        title="No reservations yet"
        subtitle="When guests book your listings, they'll show up here."
      />
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-3xl font-semibold">Reservations</h1>
      <div className="space-y-3">
        {data.map((r) => (
          <Link
            key={r.id}
            href={`/trips/${r.id}`}
            className="flex items-center gap-4 rounded-2xl border border-divider p-4 transition hover:shadow-soft"
          >
            <div className="relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-divider">
              {r.listing.images[0] && (
                <Image src={r.listing.images[0].url} alt={r.listing.title} fill sizes="80px" className="object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{r.listing.title}</p>
              <p className="text-sm text-ink-muted">
                {r.guest.name} · {r.guest_count} {r.guest_count === 1 ? "guest" : "guests"}
              </p>
              <p className="text-sm text-ink">{formatDateRange(r.check_in, r.check_out)}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold capitalize",
                  r.status === "confirmed" && "bg-green-100 text-green-800",
                  r.status === "cancelled" && "bg-gray-100 text-gray-600",
                  r.status === "pending" && "bg-amber-100 text-amber-800",
                )}
              >
                {r.status}
              </span>
              <span className="font-semibold">{formatPrice(r.total_cents)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
