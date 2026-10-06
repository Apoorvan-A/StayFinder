"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";

import { DateRangePicker } from "@/components/DateRangePicker";
import { GuestStepper } from "@/components/GuestStepper";
import { StarRating } from "@/components/StarRating";
import { Modal } from "@/components/ui/Modal";
import { apiSend } from "@/lib/api";
import { formatPrice, formatDateRange, toISODate } from "@/lib/format";
import type { BookedRange, ListingDetail, PriceQuote } from "@/types";

export function ReservationWidget({
  listing,
  bookedRanges,
}: {
  listing: ListingDetail;
  bookedRanges: BookedRange[];
}) {
  const router = useRouter();
  const [range, setRange] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(1);
  const [quote, setQuote] = useState<PriceQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const complete = Boolean(range?.from && range?.to);

  useEffect(() => {
    if (!range?.from || !range?.to) {
      setQuote(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    apiSend<PriceQuote>("/api/bookings/quote", "POST", {
      listing_id: listing.id,
      check_in: toISODate(range.from),
      check_out: toISODate(range.to),
      guests,
    })
      .then((q) => {
        if (!cancelled) setQuote(q);
      })
      .catch(() => {
        if (!cancelled) setQuote(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range?.from, range?.to, guests, listing.id]);

  const reserve = () => {
    if (!range?.from || !range?.to) return;
    const params = new URLSearchParams({
      listing_id: String(listing.id),
      check_in: toISODate(range.from),
      check_out: toISODate(range.to),
      guests: String(guests),
    });
    router.push(`/checkout?${params.toString()}`);
  };

  const unavailable = quote ? !quote.available : false;

  const priceLines = quote && quote.available && (
    <div className="space-y-3 text-sm">
      <div className="flex justify-between">
        <span className="underline">
          {formatPrice(quote.nightly_rate_cents)} × {quote.night_count} nights
        </span>
        <span>{formatPrice(quote.accommodation_cents)}</span>
      </div>
      <div className="flex justify-between">
        <span className="underline">Cleaning fee</span>
        <span>{formatPrice(quote.cleaning_fee_cents)}</span>
      </div>
      <div className="flex justify-between">
        <span className="underline">Service fee</span>
        <span>{formatPrice(quote.service_fee_cents)}</span>
      </div>
      <div className="flex justify-between">
        <span className="underline">Taxes</span>
        <span>{formatPrice(quote.taxes_cents)}</span>
      </div>
      <div className="flex justify-between border-t border-divider pt-3 text-base font-semibold">
        <span>Total</span>
        <span>{formatPrice(quote.total_cents)}</span>
      </div>
    </div>
  );

  const controls = (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-hairline">
        <div className="grid grid-cols-2 divide-x divide-hairline border-b border-hairline">
          <DateField label="Check-in" value={range?.from ? toISODate(range.from) : "Add date"} />
          <DateField label="Checkout" value={range?.to ? toISODate(range.to) : "Add date"} />
        </div>
        <div className="p-2">
          <DateRangePicker
            range={range}
            onChange={setRange}
            bookedRanges={bookedRanges}
            numberOfMonths={1}
          />
        </div>
      </div>
      <div className="rounded-xl border border-hairline p-4">
        <GuestStepper
          value={guests}
          onChange={setGuests}
          max={listing.max_guests}
          label="Guests"
          sublabel={`This place allows up to ${listing.max_guests} guests`}
        />
      </div>

      {unavailable && (
        <p className="rounded-lg bg-brand/10 px-3 py-2 text-sm text-brand-dark">
          Those dates aren&apos;t available. Please choose different dates.
        </p>
      )}

      <button
        type="button"
        onClick={reserve}
        disabled={!complete || unavailable || loading}
        className="btn-primary w-full"
      >
        {complete ? "Reserve" : "Check availability"}
      </button>
      <p className="text-center text-sm text-ink-muted">You won&apos;t be charged yet</p>

      {priceLines}
    </div>
  );

  return (
    <>
      {/* Desktop sticky card */}
      <aside className="hidden lg:block">
        <div className="sticky top-28 rounded-2xl border border-hairline bg-white p-6 shadow-card">
          <div className="mb-4 flex items-baseline justify-between">
            <p>
              <span className="text-2xl font-semibold">{formatPrice(listing.nightly_price_cents)}</span>
              <span className="text-ink-muted"> night</span>
            </p>
            <StarRating rating={listing.rating} reviewCount={listing.review_count} showCount />
          </div>
          {controls}
        </div>
      </aside>

      {/* Mobile sticky bottom bar */}
      <div className="fixed bottom-14 left-0 right-0 z-40 border-t border-divider bg-white px-6 py-3 lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold">
              {quote && quote.available ? formatPrice(quote.total_cents) : formatPrice(listing.nightly_price_cents)}
              <span className="font-normal text-ink-muted">
                {quote && quote.available ? " total" : " night"}
              </span>
            </p>
            {range?.from && range?.to ? (
              <p className="text-xs underline">{formatDateRange(toISODate(range.from), toISODate(range.to))}</p>
            ) : (
              <p className="text-xs text-ink-muted">Add dates for prices</p>
            )}
          </div>
          <button type="button" className="btn-primary" onClick={() => setMobileOpen(true)}>
            Reserve
          </button>
        </div>
      </div>

      <Modal open={mobileOpen} onClose={() => setMobileOpen(false)} title="Your trip" fullScreenOnMobile>
        {controls}
      </Modal>
    </>
  );
}

function DateField({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide">{label}</p>
      <p className="text-sm text-ink-muted">{value}</p>
    </div>
  );
}
