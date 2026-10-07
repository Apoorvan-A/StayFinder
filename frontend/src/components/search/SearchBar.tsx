"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { DateRange } from "react-day-picker";

import { DateRangePicker } from "@/components/DateRangePicker";
import { GuestStepper } from "@/components/GuestStepper";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";
import { formatDateRange, toISODate } from "@/lib/format";

type Section = "where" | "dates" | "who" | null;

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

export function SearchBar({ variant = "full" }: { variant?: "full" | "compact" }) {
  const router = useRouter();
  const initial = useInitialState();
  const [expanded, setExpanded] = useState(false);
  const [section, setSection] = useState<Section>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location, setLocation] = useState(initial.location);
  const [range, setRange] = useState<DateRange | undefined>(initial.range);
  const [guests, setGuests] = useState(initial.guests);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setExpanded(false);
        setSection(null);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const submit = () => {
    const params = new URLSearchParams();
    if (location.trim()) params.set("location", location.trim());
    if (range?.from && range?.to) {
      params.set("check_in", toISODate(range.from));
      params.set("check_out", toISODate(range.to));
    }
    if (guests > 1) params.set("guests", String(guests));
    setExpanded(false);
    setSection(null);
    setMobileOpen(false);
    router.push(`/?${params.toString()}`);
  };

  const dateLabel =
    range?.from && range?.to
      ? formatDateRange(toISODate(range.from), toISODate(range.to))
      : "Any week";
  const guestLabel = guests > 1 ? `${guests} guests` : "Add guests";

  // --- Mobile compact trigger ---
  const mobileTrigger = (
    <button
      type="button"
      onClick={() => setMobileOpen(true)}
      className="flex w-full items-center gap-3 rounded-full border border-hairline bg-white px-4 py-3 shadow-pill md:hidden"
    >
      <Search className="h-4 w-4 text-ink" />
      <span className="flex flex-col items-start">
        <span className="text-sm font-semibold text-ink">
          {location || "Where to?"}
        </span>
        <span className="text-xs text-ink-muted">
          {dateLabel} · {guestLabel}
        </span>
      </span>
    </button>
  );

  const segmentBase =
    "flex flex-col items-start rounded-full px-6 py-3 text-left transition hover:bg-surface";

  return (
    <>
      {/* Mobile */}
      <div className={cn("w-full", variant === "compact" && "md:hidden")}>{mobileTrigger}</div>

      {/* Desktop */}
      <div ref={ref} className="relative hidden md:block">
        {!expanded ? (
          <button
            type="button"
            onClick={() => {
              setExpanded(true);
              setSection("where");
            }}
            className="flex items-center rounded-full border border-hairline bg-white py-1.5 pl-6 pr-1.5 shadow-pill transition hover:shadow-card"
          >
            <span className="px-2 text-sm font-semibold text-ink">{location || "Anywhere"}</span>
            <span className="h-6 w-px bg-hairline" />
            <span className="px-4 text-sm font-semibold text-ink">{dateLabel}</span>
            <span className="h-6 w-px bg-hairline" />
            <span className="px-4 text-sm text-ink-muted">{guestLabel}</span>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand text-white">
              <Search className="h-4 w-4" />
            </span>
          </button>
        ) : (
          <div className="flex items-center rounded-full border border-hairline bg-white shadow-card">
            <button
              type="button"
              onClick={() => setSection("where")}
              className={cn(segmentBase, section === "where" && "bg-surface")}
            >
              <span className="text-xs font-semibold text-ink">Where</span>
              <input
                autoFocus
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="Search destinations"
                className="w-40 bg-transparent text-sm outline-none placeholder:text-ink-muted"
              />
            </button>
            <span className="h-8 w-px bg-hairline" />
            <button
              type="button"
              onClick={() => setSection("dates")}
              className={cn(segmentBase, section === "dates" && "bg-surface")}
            >
              <span className="text-xs font-semibold text-ink">When</span>
              <span className="text-sm text-ink-muted">{dateLabel}</span>
            </button>
            <span className="h-8 w-px bg-hairline" />
            <button
              type="button"
              onClick={() => setSection("who")}
              className={cn(segmentBase, "rounded-full", section === "who" && "bg-surface")}
            >
              <span className="text-xs font-semibold text-ink">Who</span>
              <span className="text-sm text-ink-muted">{guestLabel}</span>
            </button>
            <button
              type="button"
              onClick={submit}
              className="m-1.5 ml-0 flex items-center gap-2 rounded-full bg-brand px-4 py-3 font-semibold text-white transition hover:bg-brand-dark"
            >
              <Search className="h-4 w-4" />
              <span className="text-sm">Search</span>
            </button>
          </div>
        )}

        {/* Desktop panels */}
        {expanded && section && (
          <div
            className={cn(
              "absolute left-1/2 top-full z-50 mt-3 -translate-x-1/2 rounded-3xl border border-divider bg-white p-6 shadow-card",
              section === "dates" ? "w-auto" : "w-80",
            )}
          >
            {section === "where" && (
              <div>
                <p className="mb-3 text-sm font-semibold">Search by destination</p>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder="Try 'Santorini' or 'Tokyo'"
                  className="w-full rounded-lg border border-hairline px-4 py-3 text-sm outline-none focus:border-ink"
                />
              </div>
            )}
            {section === "dates" && (
              <DateRangePicker range={range} onChange={setRange} numberOfMonths={2} />
            )}
            {section === "who" && (
              <GuestStepper value={guests} onChange={setGuests} label="Guests" max={16} />
            )}
          </div>
        )}
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
