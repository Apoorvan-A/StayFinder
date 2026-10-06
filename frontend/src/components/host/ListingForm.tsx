"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";

import { cn } from "@/lib/cn";
import { ApiError, apiSend, fetcher } from "@/lib/api";
import { PROPERTY_TYPES } from "@/lib/constants";
import type { Amenity, HostListingDetail, ListingDetail } from "@/types";

interface FormState {
  title: string;
  description: string;
  city: string;
  country: string;
  address: string;
  property_type: string;
  category: string;
  nightlyPrice: string; // dollars
  cleaningFee: string; // dollars
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  image_urls: string[];
  amenity_ids: number[];
}

function initialFrom(listing: HostListingDetail | null): FormState {
  if (!listing) {
    return {
      title: "",
      description: "",
      city: "",
      country: "",
      address: "",
      property_type: "Apartment",
      category: "Trending",
      nightlyPrice: "",
      cleaningFee: "0",
      max_guests: 2,
      bedrooms: 1,
      beds: 1,
      bathrooms: 1,
      image_urls: [""],
      amenity_ids: [],
    };
  }
  return {
    title: listing.title,
    description: listing.description,
    city: listing.city,
    country: listing.country,
    address: listing.address ?? "",
    property_type: listing.property_type,
    category: listing.category,
    nightlyPrice: String(listing.nightly_price_cents / 100),
    cleaningFee: String(listing.cleaning_fee_cents / 100),
    max_guests: listing.max_guests,
    bedrooms: listing.bedrooms,
    beds: listing.beds,
    bathrooms: listing.bathrooms,
    image_urls: listing.images.length ? listing.images.map((i) => i.url) : [""],
    amenity_ids: listing.amenities.map((a) => a.id),
  };
}

export function ListingForm({
  mode,
  listing,
}: {
  mode: "create" | "edit";
  listing?: HostListingDetail | null;
}) {
  const router = useRouter();
  const { data: amenities } = useSWR<Amenity[]>("/api/amenities", fetcher);
  const { data: categories } = useSWR<string[]>("/api/categories", fetcher);
  const [form, setForm] = useState<FormState>(() => initialFrom(listing ?? null));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (form.title.trim().length < 3) next.title = "Title must be at least 3 characters.";
    if (!form.city.trim()) next.city = "City is required.";
    if (!form.country.trim()) next.country = "Country is required.";
    if (!form.nightlyPrice || Number(form.nightlyPrice) <= 0) next.nightlyPrice = "Enter a nightly price.";
    const validImages = form.image_urls.filter((u) => u.trim());
    if (validImages.length === 0) next.images = "Add at least one photo URL.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setSubmitting(true);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      city: form.city.trim(),
      country: form.country.trim(),
      address: form.address.trim() || null,
      property_type: form.property_type,
      category: form.category,
      nightly_price_cents: Math.round(Number(form.nightlyPrice) * 100),
      cleaning_fee_cents: Math.round(Number(form.cleaningFee || "0") * 100),
      max_guests: form.max_guests,
      bedrooms: form.bedrooms,
      beds: form.beds,
      bathrooms: form.bathrooms,
      image_urls: form.image_urls.map((u) => u.trim()).filter(Boolean),
      amenity_ids: form.amenity_ids,
    };
    try {
      if (mode === "create") {
        const created = await apiSend<ListingDetail>("/api/host/listings", "POST", payload);
        toast.success("Listing published!");
        router.push(`/listings/${created.id}`);
      } else if (listing) {
        await apiSend<ListingDetail>(`/api/host/listings/${listing.id}`, "PATCH", payload);
        toast.success("Changes saved");
        router.push("/host/listings");
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save the listing.");
    } finally {
      setSubmitting(false);
    }
  };

  const categoryOptions = categories ?? ["Trending"];

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-8">
      <Field label="Title" error={errors.title}>
        <input className={input} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Charming loft in the city center" />
      </Field>

      <Field label="Description">
        <textarea className={cn(input, "min-h-28")} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Describe what makes your place special…" />
      </Field>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field label="City" error={errors.city}>
          <input className={input} value={form.city} onChange={(e) => set("city", e.target.value)} />
        </Field>
        <Field label="Country" error={errors.country}>
          <input className={input} value={form.country} onChange={(e) => set("country", e.target.value)} />
        </Field>
      </div>

      <Field label="Address (optional)">
        <input className={input} value={form.address} onChange={(e) => set("address", e.target.value)} />
      </Field>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field label="Property type">
          <select className={input} value={form.property_type} onChange={(e) => set("property_type", e.target.value)}>
            {PROPERTY_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Category">
          <select className={input} value={form.category} onChange={(e) => set("category", e.target.value)}>
            {categoryOptions.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Field label="Nightly price (USD)" error={errors.nightlyPrice}>
          <input className={input} type="number" min={0} value={form.nightlyPrice} onChange={(e) => set("nightlyPrice", e.target.value)} />
        </Field>
        <Field label="Cleaning fee (USD)">
          <input className={input} type="number" min={0} value={form.cleaningFee} onChange={(e) => set("cleaningFee", e.target.value)} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        <NumberField label="Guests" value={form.max_guests} min={1} onChange={(v) => set("max_guests", v)} />
        <NumberField label="Bedrooms" value={form.bedrooms} min={0} onChange={(v) => set("bedrooms", v)} />
        <NumberField label="Beds" value={form.beds} min={0} onChange={(v) => set("beds", v)} />
        <NumberField label="Bathrooms" value={form.bathrooms} min={0} step={0.5} onChange={(v) => set("bathrooms", v)} />
      </div>

      <Field label="Photos (image URLs)" error={errors.images}>
        <div className="space-y-3">
          {form.image_urls.map((url, i) => (
            <div key={i} className="flex gap-2">
              <input
                className={input}
                value={url}
                placeholder="https://images.unsplash.com/…"
                onChange={(e) => {
                  const next = [...form.image_urls];
                  next[i] = e.target.value;
                  set("image_urls", next);
                }}
              />
              <button
                type="button"
                aria-label="Remove photo"
                onClick={() => set("image_urls", form.image_urls.filter((_, idx) => idx !== i))}
                className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-lg border border-hairline hover:border-ink"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => set("image_urls", [...form.image_urls, ""])}
            className="flex items-center gap-2 text-sm font-medium underline"
          >
            <Plus className="h-4 w-4" /> Add another photo
          </button>
        </div>
      </Field>

      <Field label="Amenities">
        <div className="flex flex-wrap gap-3">
          {(amenities ?? []).map((a) => {
            const active = form.amenity_ids.includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                onClick={() =>
                  set(
                    "amenity_ids",
                    active ? form.amenity_ids.filter((id) => id !== a.id) : [...form.amenity_ids, a.id],
                  )
                }
                className={cn(
                  "rounded-xl border px-4 py-2 text-sm transition",
                  active ? "border-ink bg-surface font-semibold" : "border-hairline hover:border-ink",
                )}
              >
                {a.name}
              </button>
            );
          })}
        </div>
      </Field>

      <div className="flex items-center gap-3 border-t border-divider pt-6">
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? "Saving…" : mode === "create" ? "Publish listing" : "Save changes"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}

const input =
  "w-full rounded-lg border border-hairline px-4 py-3 text-sm outline-none transition focus:border-ink";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      {children}
      {error && <span className="mt-1 block text-sm text-brand-dark">{error}</span>}
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min = 0,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  step?: number;
}) {
  return (
    <Field label={label}>
      <input
        className={input}
        type="number"
        min={min}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </Field>
  );
}
