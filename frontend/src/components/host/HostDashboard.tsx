"use client";

import { CalendarCheck, Home, Plus, Star, TrendingUp } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";

import { StarRating } from "@/components/StarRating";
import { formatPrice } from "@/lib/format";
import { fetcher } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { HostMetrics, HostReservation, ListingDetail } from "@/types";

export function HostDashboard() {
  const { user: currentUser } = useAuth();
  const { data: metrics } = useSWR<HostMetrics>("/api/host/metrics", fetcher);
  const { data: listings } = useSWR<ListingDetail[]>("/api/host/listings", fetcher);
  const { data: reservations } = useSWR<HostReservation[]>("/api/host/reservations", fetcher);

  const cards = [
    { label: "Active listings", value: metrics ? String(metrics.active_listings) : "—", icon: Home },
    { label: "Upcoming reservations", value: metrics ? String(metrics.upcoming_reservations) : "—", icon: CalendarCheck },
    { label: "Total reservations", value: metrics ? String(metrics.total_reservations) : "—", icon: TrendingUp },
    { label: "Booked revenue", value: metrics ? formatPrice(metrics.revenue_cents) : "—", icon: TrendingUp },
    { label: "Average rating", value: metrics && metrics.average_rating ? metrics.average_rating.toFixed(2) : "New", icon: Star },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Welcome back{currentUser ? `, ${currentUser.name.split(" ")[0]}` : ""}</h1>
          <p className="text-ink-muted">Here&apos;s how your hosting is going.</p>
        </div>
        <Link href="/host/listings/new" className="btn-primary">
          <Plus className="mr-2 h-4 w-4" /> Create listing
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-divider p-5">
            <card.icon className="mb-3 h-5 w-5 text-ink-muted" />
            <p className="text-2xl font-semibold">{card.value}</p>
            <p className="text-sm text-ink-muted">{card.label}</p>
          </div>
        ))}
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your listings</h2>
          <Link href="/host/listings" className="text-sm font-medium underline">
            Manage all
          </Link>
        </div>
        {listings && listings.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.slice(0, 3).map((listing) => (
              <Link
                key={listing.id}
                href={`/host/listings/${listing.id}/edit`}
                className="flex items-center gap-4 rounded-2xl border border-divider p-4 transition hover:shadow-soft"
              >
                <div
                  className="h-16 w-16 flex-shrink-0 rounded-xl bg-divider bg-cover bg-center"
                  style={{ backgroundImage: listing.images[0] ? `url(${listing.images[0].url})` : undefined }}
                />
                <div className="min-w-0">
                  <p className="truncate font-medium">{listing.title}</p>
                  <p className="truncate text-sm text-ink-muted">{listing.city}</p>
                  <StarRating rating={listing.rating} reviewCount={listing.review_count} showCount className="mt-1" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-ink-muted">You don&apos;t have any listings yet.</p>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Recent reservations</h2>
        {reservations && reservations.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-divider">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left text-ink-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Guest</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Listing</th>
                  <th className="px-4 py-3 font-medium">Dates</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {reservations.slice(0, 5).map((r) => (
                  <tr key={r.id} className="border-t border-divider">
                    <td className="px-4 py-3">{r.guest.name}</td>
                    <td className="hidden px-4 py-3 sm:table-cell">{r.listing.title}</td>
                    <td className="px-4 py-3">
                      {r.check_in} → {r.check_out}
                    </td>
                    <td className="px-4 py-3">{formatPrice(r.total_cents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-ink-muted">No reservations yet.</p>
        )}
      </section>
    </div>
  );
}
