"use client";

import { CheckCircle2, ChevronLeft, Lock } from "lucide-react";
import { SafeImage as Image } from "@/components/SafeImage";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

import { StarRating } from "@/components/StarRating";
import { Container } from "@/components/ui/Container";
import { ApiError, apiSend, fetcher } from "@/lib/api";
import { formatDateRange, formatPrice } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";
import type { Booking, ListingDetail, PriceQuote } from "@/types";

export function CheckoutClient() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, isLoading: authLoading, openAuthModal } = useAuth();

  const listingId = Number(params.get("listing_id"));
  const checkIn = params.get("check_in") ?? "";
  const checkOut = params.get("check_out") ?? "";
  const guests = Number(params.get("guests") ?? 1);

  const { data: listing } = useSWR<ListingDetail>(
    listingId ? `/api/listings/${listingId}` : null,
    fetcher,
  );
  const [quote, setQuote] = useState<PriceQuote | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<Booking | null>(null);

  useEffect(() => {
    if (!listingId || !checkIn || !checkOut) return;
    apiSend<PriceQuote>("/api/bookings/quote", "POST", {
      listing_id: listingId,
      check_in: checkIn,
      check_out: checkOut,
      guests,
    })
      .then(setQuote)
      .catch(() => setQuote(null));
  }, [listingId, checkIn, checkOut, guests]);

  if (!listingId || !checkIn || !checkOut) {
    return (
      <Container className="py-16 text-center">
        <h1 className="text-2xl font-semibold">Nothing to check out</h1>
        <p className="mt-2 text-ink-muted">Choose a stay and dates to start a booking.</p>
        <Link href="/" className="btn-primary mt-6 inline-flex">
          Explore stays
        </Link>
      </Container>
    );
  }

  if (!authLoading && !user) {
    return (
      <Container className="py-16 text-center">
        <h1 className="text-2xl font-semibold">Sign in to complete your booking</h1>
        <p className="mt-2 text-ink-muted">Your dates are saved — just sign in to confirm.</p>
        <button type="button" onClick={openAuthModal} className="btn-primary mt-6">
          Log in or sign up
        </button>
      </Container>
    );
  }

  const confirm = async () => {
    setSubmitting(true);
    try {
      const booking = await apiSend<Booking>("/api/bookings", "POST", {
        listing_id: listingId,
        check_in: checkIn,
        check_out: checkOut,
        guests,
      });
      setConfirmed(booking);
      toast.success("Booking confirmed!");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        toast.error("Those dates were just booked. Please pick different dates.");
      } else if (err instanceof ApiError && err.status === 401) {
        toast.error("Select a demo user before booking.");
      } else {
        toast.error(err instanceof ApiError ? err.message : "Booking failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmed && listing) {
    return <Confirmation booking={confirmed} listing={listing} />;
  }

  return (
    <Container className="max-w-[1032px] py-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1 text-sm font-medium hover:underline"
      >
        <ChevronLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="mb-8 text-[26px] font-semibold">Confirm and pay</h1>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <section>
            <h2 className="mb-4 text-xl font-semibold">Your trip</h2>
            <dl className="space-y-3">
              <Row label="Dates" value={formatDateRange(checkIn, checkOut)} />
              <Row label="Guests" value={`${guests} ${guests === 1 ? "guest" : "guests"}`} />
              <Row label="Booking as" value={user?.name ?? "—"} />
            </dl>
          </section>

          <div className="h-px bg-divider" />

          <section>
            <h2 className="mb-3 text-xl font-semibold">Pay with</h2>
            <p className="mb-4 flex items-start gap-2 rounded-xl bg-brand-tint px-4 py-3 text-sm text-ink">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-brand-dark" />
              <span>This is a demo checkout. No payment is processed — please don&apos;t enter real card details.</span>
            </p>
            <MockPaymentForm />
          </section>
        </div>

        <aside>
          <div className="sticky top-28 rounded-2xl border border-hairline p-6 shadow-soft">
            {listing && (
              <div className="mb-4 flex gap-4 border-b border-divider pb-4">
                <div className="relative h-20 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-divider">
                  {listing.images[0] && (
                    <Image src={listing.images[0].url} alt={listing.title} fill sizes="96px" className="object-cover" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{listing.title}</p>
                  <p className="truncate text-xs text-ink-muted">
                    {listing.city}, {listing.country}
                  </p>
                  <StarRating rating={listing.rating} reviewCount={listing.review_count} showCount className="mt-1" />
                </div>
              </div>
            )}

            <h3 className="mb-3 font-semibold">Price details</h3>
            {quote ? (
              <div className="space-y-3 text-sm">
                <Line label={`${formatPrice(quote.nightly_rate_cents)} × ${quote.night_count} nights`} value={formatPrice(quote.accommodation_cents)} />
                <Line label="Cleaning fee" value={formatPrice(quote.cleaning_fee_cents)} />
                <Line label="Service fee" value={formatPrice(quote.service_fee_cents)} />
                <Line label="Taxes" value={formatPrice(quote.taxes_cents)} />
                <div className="flex justify-between border-t border-divider pt-3 text-base font-semibold">
                  <span>Total (USD)</span>
                  <span>{formatPrice(quote.total_cents)}</span>
                </div>
              </div>
            ) : (
              <div className="skeleton h-28 w-full rounded" />
            )}

            <button
              type="button"
              onClick={confirm}
              disabled={submitting || !quote || !quote.available}
              className="btn-primary mt-6 w-full"
            >
              {submitting ? "Confirming…" : "Confirm and pay"}
            </button>
            {quote && !quote.available && (
              <p className="mt-2 text-center text-sm text-brand-dark">These dates are no longer available.</p>
            )}
          </div>
        </aside>
      </div>
    </Container>
  );
}

function MockPaymentForm() {
  return (
    <div className="space-y-4">
      <input
        className="w-full rounded-lg border border-hairline px-4 py-3 text-sm outline-none focus:border-ink"
        placeholder="Card number (e.g. 4242 4242 4242 4242)"
        inputMode="numeric"
        aria-label="Card number"
      />
      <div className="grid grid-cols-2 gap-4">
        <input className="rounded-lg border border-hairline px-4 py-3 text-sm outline-none focus:border-ink" placeholder="MM / YY" aria-label="Expiry" />
        <input className="rounded-lg border border-hairline px-4 py-3 text-sm outline-none focus:border-ink" placeholder="CVC" aria-label="CVC" />
      </div>
      <input className="w-full rounded-lg border border-hairline px-4 py-3 text-sm outline-none focus:border-ink" placeholder="Name on card" aria-label="Name on card" />
    </div>
  );
}

function Confirmation({ booking, listing }: { booking: Booking; listing: ListingDetail }) {
  return (
    <Container className="flex flex-col items-center py-16 text-center">
      <CheckCircle2 className="h-16 w-16 text-brand" />
      <h1 className="mt-4 text-3xl font-semibold">Your booking is confirmed</h1>
      <p className="mt-2 text-ink-muted">
        {listing.title} — {listing.city}, {listing.country}
      </p>

      <div className="mt-8 w-full max-w-md rounded-2xl border border-divider p-6 text-left">
        <div className="flex items-center justify-between border-b border-divider pb-4">
          <span className="text-ink-muted">Confirmation code</span>
          <span className="font-mono text-lg font-semibold tracking-wider">{booking.confirmation_code}</span>
        </div>
        <dl className="mt-4 space-y-3 text-sm">
          <Row label="Dates" value={formatDateRange(booking.check_in, booking.check_out)} />
          <Row label="Guests" value={String(booking.guest_count)} />
          <Row label="Total paid" value={formatPrice(booking.total_cents)} />
        </dl>
      </div>

      <div className="mt-8 flex gap-3">
        <Link href="/trips" className="btn-primary">
          View my trips
        </Link>
        <Link href={`/listings/${listing.id}`} className="btn-secondary">
          Back to listing
        </Link>
      </div>
    </Container>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="font-medium">{value}</dd>
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
