"use client";

import { Award, CalendarX, Clock, Lock, Shield, Star } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import useSWR from "swr";

import { StartMessageButton } from "@/components/messaging/StartMessageButton";
import { StarRating } from "@/components/StarRating";
import { Modal } from "@/components/ui/Modal";
import { apiSend, fetcher } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { CANCELLATION_POLICY } from "@/lib/constants";
import { formatShortDate } from "@/lib/format";
import { resolveIcon } from "@/lib/icons";
import type { Amenity, ConversationDetail, ListingDetail, ReviewSummary } from "@/types";

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

export function MeetYourHost({ listing }: { listing: ListingDetail }) {
  const host = listing.host;
  const { user } = useAuth();
  const isOwnListing = user?.id === host.id;
  const stats: { label: string; value: string }[] = [];
  if (host.host_since_year) {
    stats.push({ label: "Years hosting", value: String(Math.max(1, new Date().getFullYear() - host.host_since_year)) });
  }
  if (host.response_rate != null) stats.push({ label: "Response rate", value: `${host.response_rate}%` });
  if (host.response_time) stats.push({ label: "Responds", value: host.response_time });
  if (host.languages) stats.push({ label: "Speaks", value: host.languages });

  return (
    <section>
      <h2 className="mb-5 text-2xl font-semibold">Meet your host</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-[260px_1fr] sm:items-center">
        <div className="flex flex-col items-center rounded-2xl border border-divider p-6 text-center shadow-soft">
          {host.avatar_url && (
            <Image src={host.avatar_url} alt={host.name} width={88} height={88} className="h-20 w-20 rounded-full object-cover" />
          )}
          <p className="mt-3 text-xl font-semibold">{host.name}</p>
          {host.is_superhost && (
            <p className="mt-1 flex items-center gap-1 text-sm text-ink-muted">
              <Award className="h-4 w-4" /> Superhost
            </p>
          )}
        </div>
        <div>
          {host.bio && <p className="mb-4 leading-relaxed text-ink">{host.bio}</p>}
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="text-xs text-ink-muted">{s.label}</dt>
                <dd className="font-medium">{s.value}</dd>
              </div>
            ))}
          </dl>
          {!isOwnListing && (
            <div className="mt-5">
              <StartMessageButton
                label="Message host"
                modalTitle={`Message ${host.name}`}
                placeholder={`Hi ${host.name}, I had a question about your place…`}
                onSend={(body) =>
                  apiSend<ConversationDetail>("/api/conversations", "POST", {
                    listing_id: listing.id,
                    body,
                  }).then((c) => c.id)
                }
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function WhereYoullBe({ listing }: { listing: ListingDetail }) {
  const hasCoords = listing.latitude != null && listing.longitude != null;
  let src = "";
  if (hasCoords) {
    const { latitude: lat, longitude: lng } = listing;
    const delta = 0.035; // Broad bounding box → approximate area, not an exact pin.
    const bbox = `${lng! - delta},${lat! - delta},${lng! + delta},${lat! + delta}`;
    src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`;
  }
  return (
    <section>
      <h2 className="mb-2 text-2xl font-semibold">Where you&apos;ll be</h2>
      <p className="mb-5 font-medium">
        {listing.city}, {listing.country}
      </p>
      {hasCoords && (
        <div className="overflow-hidden rounded-2xl border border-divider">
          <iframe title={`Approximate map of ${listing.city}`} src={src} className="h-[340px] w-full" loading="lazy" />
        </div>
      )}
      <p className="mt-4 leading-relaxed text-ink">{listing.area_description}</p>
      <p className="mt-3 flex items-center gap-2 text-sm text-ink-muted">
        <Lock className="h-4 w-4" /> Exact location provided after booking.
      </p>
    </section>
  );
}

export function ThingsToKnow({ listing }: { listing: ListingDetail }) {
  const petsAllowed = listing.amenities.some((a) => a.name.toLowerCase().includes("pets"));
  const houseRules = [
    `Check-in after ${listing.check_in_time}`,
    `Checkout before ${listing.check_out_time}`,
    `${listing.max_guests} guests maximum`,
    petsAllowed ? "Pets allowed" : "No pets",
    "No smoking",
    "No parties or events",
  ];
  const safetyFromAmenities = listing.amenities
    .filter((a) => a.category === "safety")
    .map((a) => a.name);
  const safety = [...new Set([...safetyFromAmenities, "Smoke alarm", "Carbon monoxide alarm"])];

  return (
    <section>
      <h2 className="mb-6 text-2xl font-semibold">Things to know</h2>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <Column icon={<Clock className="h-5 w-5" />} title="House rules" items={houseRules} />
        <Column icon={<Shield className="h-5 w-5" />} title="Safety & property" items={safety} />
        <div>
          <h3 className="mb-3 flex items-center gap-2 font-semibold">
            <CalendarX className="h-5 w-5" /> Cancellation
          </h3>
          <p className="text-sm font-medium">{CANCELLATION_POLICY.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-muted">{CANCELLATION_POLICY.summary}</p>
        </div>
      </div>
    </section>
  );
}

function Column({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  return (
    <div>
      <h3 className="mb-3 flex items-center gap-2 font-semibold">
        {icon} {title}
      </h3>
      <ul className="space-y-2 text-sm text-ink">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
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
        {data.rating.toFixed(1)} · {data.review_count} reviews
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
