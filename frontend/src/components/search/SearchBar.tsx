"use client";

import { House, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { DateRange } from "react-day-picker";

import { DateRangePicker } from "@/components/DateRangePicker";
import { GuestStepper } from "@/components/GuestStepper";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";
import { formatDateRange, toISODate } from "@/lib/format";

type Section = "where" | "dates" | "who" | null;

const POPULAR_DESTINATIONS = ["Santorini", "Tokyo", "Tulum", "Lisbon", "Barcelona", "Reykjavik"];

function useInitialState() {
  const params = useSearchParams();
  const ci = params.get("check_in");
  const co = params.get("check_out");
  return {
    location: params.get("location") ?? "",
    guests: Number(params.get("guests") ?? 1),
    range:
      ci && co
        ? { from: new Date(ci + "T00:00:00"), to: new Date(co + "T00:00:00") }
        : undefined,
  };
}

export function SearchBar({ variant = "full", compact = false }: { variant?: "full" | "compact"; compact?: boolean }) {
  const router = useRouter();
  const initial = useInitialState();
  const [section, setSection] = useState<Section>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location, setLocation] = useState(initial.location);
  const [range, setRange] = useState<DateRange | undefined>(initial.range);
  const [guests, setGuests] = useState(initial.guests);
  const [expandedFromCompact, setExpandedFromCompact] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const destinationInputRef = useRef<HTMLInputElement>(null);
  const datesButtonRef = useRef<HTMLButtonElement>(null);
  const guestsButtonRef = useRef<HTMLButtonElement>(null);
  const showCompact = variant === "full" && compact && !expandedFromCompact;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setSection(null);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!compact) setExpandedFromCompact(false);
    else if (!expandedFromCompact) setSection(null);
  }, [compact, expandedFromCompact]);

  useEffect(() => {
    if (!compact || !expandedFromCompact || !section) return;
    const frame = window.requestAnimationFrame(() => {
      if (section === "where") destinationInputRef.current?.focus();
      if (section === "dates") datesButtonRef.current?.focus();
      if (section === "who") guestsButtonRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [compact, expandedFromCompact, section]);

  const submit = () => {
    const params = new URLSearchParams();
    if (location.trim()) params.set("location", location.trim());
    if (range?.from && range?.to) {
      params.set("check_in", toISODate(range.from));
      params.set("check_out", toISODate(range.to));
    }
    if (guests > 1) params.set("guests", String(guests));
    setSection(null);
    setMobileOpen(false);
    router.push(`/?${params.toString()}`);
  };

  const dateLabel =
    range?.from && range?.to
      ? formatDateRange(toISODate(range.from), toISODate(range.to))
      : "Add dates";
  const guestLabel = guests > 1 ? `${guests} guests` : "Add guests";

  const active = section !== null;

  // --- Mobile compact trigger ---
  const mobileTrigger = (
    <button
      type="button"
      onClick={() => setMobileOpen(true)}
      className="flex w-full items-center gap-3 rounded-full border border-hairline bg-white px-4 py-3 shadow-pill lg:hidden"
    >
      <Search className="h-4 w-4 text-ink" />
      <span className="flex flex-col items-start">
        <span className="text-sm font-semibold text-ink">{location || "Where to?"}</span>
        <span className="text-xs text-ink-muted">
          {dateLabel} · {guestLabel}
        </span>
      </span>
    </button>
  );

  const segment = "flex flex-col items-start rounded-full px-6 py-2.5 text-left transition";

  return (
    <>
      {/* Mobile + tablet compact trigger */}
      <div className={cn("w-full", variant === "compact" && "lg:hidden")}>{mobileTrigger}</div>

      {/* Desktop search keeps the same state in both presentations. */}
      <div ref={ref} className="relative mx-auto hidden min-h-14 w-full lg:block">
        <div
          className={cn(
            "absolute inset-x-0 top-0 mx-auto w-full transition-all duration-300 motion-reduce:transition-none",
            showCompact
              ? "invisible pointer-events-none max-w-[500px] -translate-y-2 scale-[0.98] opacity-0"
              : "max-w-full translate-y-0 scale-100 opacity-100",
          )}
          aria-hidden={showCompact}
        >
        <div
          className={cn(
            "flex items-center rounded-full border bg-white transition",
            active ? "border-hairline bg-surface/60 shadow-card" : "border-hairline shadow-pill hover:shadow-card",
          )}
        >
          {/* Where */}
          <button
            type="button"
            onClick={() => setSection("where")}
            className={cn(segment, "flex-[1.4]", section === "where" ? "bg-white shadow-soft" : "hover:bg-black/[0.03]")}
          >
            <span className="text-xs font-semibold text-ink">Where</span>
            <input
              ref={destinationInputRef}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onFocus={() => setSection("where")}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Search destinations"
              className="w-full bg-transparent text-sm outline-none placeholder:text-ink-muted"
            />
          </button>
          <span className="h-9 w-px bg-hairline" />
          {/* Check in */}
          <button
            ref={datesButtonRef}
            type="button"
            onClick={() => setSection("dates")}
            className={cn(segment, "flex-1", section === "dates" ? "bg-white shadow-soft" : "hover:bg-black/[0.03]")}
          >
            <span className="text-xs font-semibold text-ink">When</span>
            <span className={cn("truncate text-sm", range?.from ? "text-ink" : "text-ink-muted")}>{dateLabel}</span>
          </button>
          <span className="h-9 w-px bg-hairline" />
          {/* Who + search */}
          <div className={cn("flex flex-1 items-center justify-between rounded-full pr-2", section === "who" && "bg-white shadow-soft")}>
            <button ref={guestsButtonRef} type="button" onClick={() => setSection("who")} className={cn(segment, "flex-1")}>
              <span className="text-xs font-semibold text-ink">Who</span>
              <span className={cn("truncate text-sm", guests > 1 ? "text-ink" : "text-ink-muted")}>{guestLabel}</span>
            </button>
            <button
              type="button"
              onClick={submit}
              className="flex items-center gap-2 rounded-full bg-brand px-4 py-3 font-semibold text-white transition hover:bg-brand-dark"
            >
              <Search className="h-4 w-4" />
              {active && <span className="text-sm">Search</span>}
            </button>
          </div>
        </div>

        {/* Popovers */}
        {section === "where" && (
          <div className="absolute left-0 top-full z-50 mt-3 w-80 rounded-3xl border border-divider bg-white p-6 shadow-card">
            <p className="mb-3 text-sm font-semibold">Popular destinations</p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_DESTINATIONS.map((dest) => (
                <button
                  key={dest}
                  type="button"
                  onClick={() => {
                    setLocation(dest);
                    setSection("dates");
                  }}
                  className="rounded-full border border-hairline px-4 py-2 text-sm transition hover:border-ink"
                >
                  {dest}
                </button>
              ))}
            </div>
          </div>
        )}
        {section === "dates" && (
          <div className="absolute left-1/2 top-full z-50 mt-3 -translate-x-1/2 rounded-3xl border border-divider bg-white p-6 shadow-card">
            <DateRangePicker range={range} onChange={setRange} numberOfMonths={2} />
          </div>
        )}
        {section === "who" && (
          <div className="absolute right-0 top-full z-50 mt-3 w-80 rounded-3xl border border-divider bg-white p-6 shadow-card">
            <GuestStepper value={guests} onChange={setGuests} label="Guests" max={16} />
          </div>
        )}
        </div>

        <div
          className={cn(
            "absolute inset-x-0 top-0 mx-auto w-full max-w-[500px] transition-all duration-300 motion-reduce:transition-none",
            showCompact
              ? "relative translate-y-0 scale-100 opacity-100"
              : "invisible pointer-events-none -translate-y-2 scale-[0.98] opacity-0",
          )}
          aria-hidden={!showCompact}
        >
          <div className="flex h-14 items-center rounded-full border border-hairline bg-white px-2 shadow-card">
            <button
              type="button"
              aria-label={`Change destination: ${location || "Anywhere"}`}
              onClick={() => { setExpandedFromCompact(true); setSection("where"); }}
              className="flex min-w-0 flex-[1.1] items-center gap-2 rounded-full px-3 py-2 text-left text-sm font-medium text-ink transition hover:bg-surface"
            >
              <House className="h-4 w-4 flex-shrink-0 text-ink-muted" />
              <span className="truncate">{location || "Anywhere"}</span>
            </button>
            <span className="h-6 w-px bg-hairline" />
            <button
              type="button"
              aria-label={`Change dates: ${range?.from && range?.to ? dateLabel : "Anytime"}`}
              onClick={() => { setExpandedFromCompact(true); setSection("dates"); }}
              className="min-w-0 flex-1 truncate rounded-full px-3 py-2 text-left text-sm font-medium text-ink transition hover:bg-surface"
            >
              {range?.from && range?.to ? dateLabel : "Anytime"}
            </button>
            <span className="h-6 w-px bg-hairline" />
            <button
              type="button"
              aria-label={`Change guests: ${guestLabel}`}
              onClick={() => { setExpandedFromCompact(true); setSection("who"); }}
              className="min-w-0 flex-1 truncate rounded-full px-3 py-2 text-left text-sm font-medium text-ink transition hover:bg-surface"
            >
              {guestLabel}
            </button>
            <button
              type="button"
              aria-label="Expand full search"
              onClick={() => { setExpandedFromCompact(true); setSection("where"); }}
              className="ml-1 grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-brand text-white transition hover:bg-brand-dark"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sheet */}
      <Modal
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        title="Search stays"
        fullScreenOnMobile
        footer={
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="font-semibold underline"
              onClick={() => {
                setLocation("");
                setRange(undefined);
                setGuests(1);
              }}
            >
              Clear all
            </button>
            <button type="button" className="btn-primary" onClick={submit}>
              <Search className="mr-2 h-4 w-4" /> Search
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-semibold">Where</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Search destinations"
              className="w-full rounded-lg border border-hairline px-4 py-3 text-sm outline-none focus:border-ink"
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">When</p>
            <DateRangePicker range={range} onChange={setRange} numberOfMonths={1} />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">Who</p>
            <GuestStepper value={guests} onChange={setGuests} max={16} />
          </div>
        </div>
      </Modal>
    </>
  );
}
