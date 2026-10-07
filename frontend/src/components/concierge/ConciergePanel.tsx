"use client";

import { ArrowRight, SendHorizonal, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { SafeImage } from "@/components/SafeImage";
import { StarRating } from "@/components/StarRating";
import { ApiError, apiSend } from "@/lib/api";
import { formatNightlyPrice } from "@/lib/format";
import { useConcierge } from "@/hooks/useConcierge";
import type { ConciergeResponse, ListingCard } from "@/types";

const EXAMPLES = [
  "Villa in Greece with a pool",
  "Cozy cabin under $300",
  "Beachfront stay for 4",
  "Design apartment in a city",
];

type Turn =
  | { role: "user"; text: string }
  | { role: "assistant"; response: ConciergeResponse }
  | { role: "error"; text: string };

export function ConciergePanel() {
  const { open, closePanel } = useConcierge();
  const router = useRouter();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreFocus.current = document.activeElement as HTMLElement;
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      restoreFocus.current?.focus?.();
    };
  }, [open, closePanel]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, loading]);

  const submit = async (message: string) => {
    const text = message.trim();
    if (!text || loading) return;
    setTurns((t) => [...t, { role: "user", text }]);
    setInput("");
    setLoading(true);
    try {
      const response = await apiSend<ConciergeResponse>("/api/concierge", "POST", { message: text });
      setTurns((t) => [...t, { role: "assistant", response }]);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? "I couldn't search with the concierge right now. You can still use StayFinder search."
          : "Something went wrong. Please try again.";
      setTurns((t) => [...t, { role: "error", text: msg }]);
    } finally {
      setLoading(false);
    }
  };

  const openResults = (queryString: string) => {
    closePanel();
    router.push(`/?${queryString}`);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[75]">
      <div className="absolute inset-0 bg-black/40" onClick={closePanel} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="StayFinder AI concierge"
        className="absolute inset-y-0 right-0 flex w-full flex-col bg-white shadow-card animate-fade-in sm:w-[440px]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-divider px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-brand/10 text-brand">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold leading-tight">StayFinder Concierge</p>
              <p className="text-xs text-ink-muted">Describe your ideal stay</p>
            </div>
          </div>
          <button
            type="button"
            onClick={closePanel}
            aria-label="Close concierge"
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div ref={bodyRef} className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {turns.length === 0 && (
            <div>
              <p className="text-ink">Tell me what kind of stay you&apos;re looking for.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => submit(ex)}
                    className="rounded-full border border-hairline px-3 py-1.5 text-sm transition hover:border-ink"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          {turns.map((turn, i) => {
            if (turn.role === "user") {
              return (
                <div key={i} className="flex justify-end">
                  <p className="max-w-[80%] rounded-2xl bg-ink px-4 py-2.5 text-sm text-white">{turn.text}</p>
                </div>
              );
            }
            if (turn.role === "error") {
              return (
                <p key={i} className="rounded-xl bg-brand-tint px-4 py-3 text-sm text-ink">{turn.text}</p>
              );
            }
            const r = turn.response;
            return (
              <div key={i} className="space-y-3">
                <p className="text-sm text-ink">{r.interpretation}</p>
                {r.clarify && <p className="text-sm text-ink-muted">{r.clarify}</p>}
                <div className="space-y-3">
                  {r.listings.map((listing) => (
                    <ConciergeResultCard key={listing.id} listing={listing} onNavigate={closePanel} />
                  ))}
                </div>
                {r.total > 0 && r.query_string && (
                  <button
                    type="button"
                    onClick={() => openResults(r.query_string)}
                    className="flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
                  >
                    View all {r.total} matching {r.total === 1 ? "stay" : "stays"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}

          {loading && (
            <p className="flex items-center gap-2 text-sm text-ink-muted">
              <Sparkles className="h-4 w-4 animate-pulse" /> Searching StayFinder…
            </p>
          )}
        </div>

        {/* Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit(input);
          }}
          className="flex items-center gap-2 border-t border-divider px-5 py-4"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={500}
            aria-label="Describe your ideal stay"
            placeholder="e.g. Lakefront cabin for a weekend"
            className="flex-1 rounded-full border border-hairline px-4 py-2.5 text-sm outline-none focus:border-ink"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Send"
            className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-brand text-white transition hover:bg-brand-dark disabled:opacity-50"
          >
            <SendHorizonal className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

function ConciergeResultCard({ listing, onNavigate }: { listing: ListingCard; onNavigate: () => void }) {
  return (
    <Link
      href={`/listings/${listing.id}`}
      onClick={onNavigate}
      className="flex gap-3 rounded-2xl border border-divider p-2.5 transition hover:shadow-soft"
    >
      <div className="relative h-20 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-divider">
        {listing.images[0] && (
          <SafeImage src={listing.images[0].url} alt={listing.title} fill sizes="96px" className="object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-medium">{listing.city}, {listing.country}</p>
          <StarRating rating={listing.rating} className="shrink-0" />
        </div>
        <p className="truncate text-sm text-ink-muted">{listing.title}</p>
        <p className="mt-1 text-sm">
          <span className="font-semibold">{formatNightlyPrice(listing.nightly_price_cents)}</span> night
        </p>
      </div>
    </Link>
  );
}
