"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR from "swr";

import { GuestStepper } from "@/components/GuestStepper";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";
import { fetcher } from "@/lib/api";
import { PROPERTY_TYPES } from "@/lib/constants";
import type { Amenity } from "@/types";

interface Draft {
  minPrice: string;
  maxPrice: string;
  propertyType: string | null;
  bedrooms: number;
  beds: number;
  minRating: number;
  amenities: number[];
}

function readDraft(params: URLSearchParams): Draft {
  const centsToDollars = (v: string | null) => (v ? String(Number(v) / 100) : "");
  return {
    minPrice: centsToDollars(params.get("min_price")),
    maxPrice: centsToDollars(params.get("max_price")),
    propertyType: params.get("property_type"),
    bedrooms: Number(params.get("bedrooms") ?? 0),
    beds: Number(params.get("beds") ?? 0),
    minRating: Number(params.get("min_rating") ?? 0),
    amenities: (params.get("amenities") ?? "")
      .split(",")
      .filter(Boolean)
      .map(Number),
  };
}

export function FilterModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { data: amenities } = useSWR<Amenity[]>("/api/amenities", fetcher);
  const [draft, setDraft] = useState<Draft>(() => readDraft(new URLSearchParams(params.toString())));

  useEffect(() => {
    if (open) setDraft(readDraft(new URLSearchParams(params.toString())));
  }, [open, params]);

  const apply = () => {
    const next = new URLSearchParams(params.toString());
    const setOrDelete = (key: string, value: string) => {
      if (value) next.set(key, value);
      else next.delete(key);
    };
    setOrDelete("min_price", draft.minPrice ? String(Math.round(Number(draft.minPrice) * 100)) : "");
    setOrDelete("max_price", draft.maxPrice ? String(Math.round(Number(draft.maxPrice) * 100)) : "");
    setOrDelete("property_type", draft.propertyType ?? "");
    setOrDelete("bedrooms", draft.bedrooms ? String(draft.bedrooms) : "");
    setOrDelete("beds", draft.beds ? String(draft.beds) : "");
    setOrDelete("min_rating", draft.minRating ? String(draft.minRating) : "");
    setOrDelete("amenities", draft.amenities.length ? draft.amenities.join(",") : "");
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
    onClose();
  };

  const clearAll = () => {
    setDraft({
      minPrice: "",
      maxPrice: "",
      propertyType: null,
      bedrooms: 0,
      beds: 0,
      minRating: 0,
      amenities: [],
    });
  };

  const toggleAmenity = (id: number) =>
    setDraft((d) => ({
      ...d,
      amenities: d.amenities.includes(id)
        ? d.amenities.filter((a) => a !== id)
        : [...d.amenities, id],
    }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Filters"
      size="lg"
      footer={
        <div className="flex items-center justify-between">
          <button type="button" className="font-semibold underline" onClick={clearAll}>
            Clear all
          </button>
          <button type="button" className="btn-primary" onClick={apply}>
            Show results
          </button>
        </div>
      }
    >
      <div className="space-y-8">
        <section>
          <h3 className="mb-3 text-lg font-semibold">Price range</h3>
          <p className="mb-3 text-sm text-ink-muted">Nightly price before fees</p>
          <div className="flex items-center gap-4">
            <PriceInput
              label="Minimum"
              value={draft.minPrice}
              onChange={(v) => setDraft((d) => ({ ...d, minPrice: v }))}
            />
            <span className="mt-6 h-px w-4 bg-hairline" />
            <PriceInput
              label="Maximum"
              value={draft.maxPrice}
              onChange={(v) => setDraft((d) => ({ ...d, maxPrice: v }))}
            />
          </div>
        </section>

        <Divider />

        <section>
          <h3 className="mb-3 text-lg font-semibold">Property type</h3>
          <div className="flex flex-wrap gap-3">
            {PROPERTY_TYPES.map((type) => {
              const active = draft.propertyType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    setDraft((d) => ({ ...d, propertyType: active ? null : type }))
                  }
                  className={cn(
                    "rounded-xl border px-4 py-2 text-sm transition",
                    active ? "border-ink bg-surface font-semibold" : "border-hairline hover:border-ink",
                  )}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </section>

        <Divider />

        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Rooms</h3>
          <GuestStepper
            label="Bedrooms"
            value={draft.bedrooms}
            min={0}
            max={10}
            onChange={(v) => setDraft((d) => ({ ...d, bedrooms: v }))}
          />
          <GuestStepper
            label="Beds"
            value={draft.beds}
            min={0}
            max={16}
            onChange={(v) => setDraft((d) => ({ ...d, beds: v }))}
          />
        </section>

        <Divider />

        <section>
          <h3 className="mb-3 text-lg font-semibold">Amenities</h3>
          <div className="flex flex-wrap gap-3">
            {(amenities ?? []).map((amenity) => {
              const active = draft.amenities.includes(amenity.id);
              return (
                <button
                  key={amenity.id}
                  type="button"
                  onClick={() => toggleAmenity(amenity.id)}
                  className={cn(
                    "rounded-xl border px-4 py-2 text-sm transition",
                    active ? "border-ink bg-surface font-semibold" : "border-hairline hover:border-ink",
                  )}
                >
                  {amenity.name}
                </button>
              );
            })}
          </div>
        </section>

        <Divider />

        <section>
          <h3 className="mb-3 text-lg font-semibold">Minimum rating</h3>
          <div className="flex gap-3">
            {[0, 3, 4, 4.5].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setDraft((d) => ({ ...d, minRating: r }))}
                className={cn(
                  "rounded-xl border px-4 py-2 text-sm transition",
                  draft.minRating === r
                    ? "border-ink bg-surface font-semibold"
                    : "border-hairline hover:border-ink",
                )}
              >
                {r === 0 ? "Any" : `${r}+`}
              </button>
            ))}
          </div>
        </section>
      </div>
    </Modal>
  );
}

function PriceInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex-1">
      <span className="mb-1 block text-xs text-ink-muted">{label}</span>
      <div className="flex items-center rounded-lg border border-hairline px-3 py-2">
        <span className="text-ink-muted">$</span>
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          className="w-full bg-transparent px-2 text-sm outline-none"
        />
      </div>
    </label>
  );
}

function Divider() {
  return <div className="h-px bg-divider" />;
}
