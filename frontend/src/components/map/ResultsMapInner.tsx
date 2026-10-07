"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

import { StarRating } from "@/components/StarRating";
import { formatNightlyPrice } from "@/lib/format";
import type { ListingCard } from "@/types";

function priceIcon(cents: number, active: boolean): L.DivIcon {
  const label = `$${Math.round(cents / 100)}`;
  return L.divIcon({
    className: "",
    html: `<div class="sf-price-marker ${active ? "active" : ""}">${label}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 12);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 13 });
  }, [points, map]);
  return null;
}

export default function ResultsMapInner({
  listings,
  activeId,
  onSelect,
}: {
  listings: ListingCard[];
  activeId: number | null;
  onSelect: (id: number | null) => void;
}) {
  const located = listings.filter((l) => l.latitude != null && l.longitude != null);
  const points = located.map((l) => [l.latitude as number, l.longitude as number] as [number, number]);
  const center: [number, number] = points[0] ?? [20, 0];

  return (
    <MapContainer center={center} zoom={3} scrollWheelZoom className="h-full w-full">
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <FitBounds points={points} />
      {located.map((l) => (
        <Marker
          key={l.id}
          position={[l.latitude as number, l.longitude as number]}
          icon={priceIcon(l.nightly_price_cents, l.id === activeId)}
          eventHandlers={{ click: () => onSelect(l.id) }}
          zIndexOffset={l.id === activeId ? 1000 : 0}
        >
          <Popup closeButton={false} autoPan>
            <Link href={`/listings/${l.id}`} className="block w-48 no-underline">
              {l.images[0] && (
                <img
                  src={l.images[0].url}
                  alt={l.title}
                  className="h-28 w-full rounded-lg object-cover"
                />
              )}
              <p className="mt-2 flex items-center justify-between gap-2 text-sm font-semibold text-ink">
                <span className="truncate">{l.city}, {l.country}</span>
                <StarRating rating={l.rating} />
              </p>
              <p className="truncate text-xs text-ink-muted">{l.title}</p>
              <p className="mt-1 text-sm text-ink">
                <span className="font-semibold">{formatNightlyPrice(l.nightly_price_cents)}</span> night
              </p>
            </Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
