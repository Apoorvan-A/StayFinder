"use client";

import { SearchX } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

import { CategoryRow } from "@/components/CategoryRow";
import { FilterModal } from "@/components/FilterModal";
import { ListingGrid, ListingGridSkeleton } from "@/components/ListingGrid";
import { Container } from "@/components/ui/Container";
import { fetcher } from "@/lib/api";
import { PAGE_SIZE, SORT_OPTIONS } from "@/lib/constants";
import type { ListingCard, Page } from "@/types";

const FILTER_KEYS = [
  "location",
  "check_in",
  "check_out",
  "guests",
  "min_price",
  "max_price",
  "property_type",
  "bedrooms",
  "beds",
  "min_rating",
  "amenities",
];

function buildApiQuery(params: URLSearchParams, pageSize: number): string {
  const api = new URLSearchParams();
  const pass = (key: string) => {
    const v = params.get(key);
    if (v) api.set(key, v);
  };
  ["location", "check_in", "check_out", "guests", "min_price", "max_price", "property_type", "category", "bedrooms", "beds", "min_rating"].forEach(pass);
  // amenities stored comma-joined in the URL → repeated params for the API.
  const amenities = params.get("amenities");
  if (amenities) amenities.split(",").filter(Boolean).forEach((id) => api.append("amenities", id));
  api.set("sort", params.get("sort") ?? "recommended");
  api.set("page", "1");
  api.set("page_size", String(pageSize));
  return api.toString();
}

export function ExploreClient() {
  const params = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [pagesLoaded, setPagesLoaded] = useState(1);

  const paramsString = params.toString();

  // Reset accumulation whenever the search/filters change.
  useEffect(() => {
    setPagesLoaded(1);
  }, [paramsString]);

  const pageSize = PAGE_SIZE * pagesLoaded;
  const apiQuery = useMemo(
    () => buildApiQuery(new URLSearchParams(paramsString), pageSize),
    [paramsString, pageSize],
  );

  const { data, error, isLoading } = useSWR<Page<ListingCard>>(
    `/api/listings?${apiQuery}`,
    fetcher,
    { keepPreviousData: true },
  );

  const activeFilterCount = useMemo(() => {
    const p = new URLSearchParams(paramsString);
    return FILTER_KEYS.filter((k) => p.get(k)).length;
  }, [paramsString]);

  const sort = params.get("sort") ?? "recommended";
  const listings = data?.items ?? [];
  const hasMore = data ? listings.length < data.total : false;

  return (
    <>
      <div className="sticky top-16 z-30 border-b border-divider bg-white md:top-20">
        <Container>
          <CategoryRow onOpenFilters={() => setFiltersOpen(true)} activeFilterCount={activeFilterCount} />
        </Container>
      </div>

      <Container className="py-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="text-sm text-ink-muted">
            {data ? `${data.total} ${data.total === 1 ? "stay" : "stays"}` : "Searching…"}
          </p>
          <SortSelect current={sort} paramsString={paramsString} />
        </div>

        {isLoading && !data ? (
          <ListingGridSkeleton count={PAGE_SIZE} />
        ) : error ? (
          <EmptyState
            title="Something went wrong"
            subtitle="We couldn't load listings. Make sure the API is running and try again."
          />
        ) : listings.length === 0 ? (
          <EmptyState
            title="No stays match your search"
            subtitle="Try adjusting your dates, filters, or search a different destination."
          />
        ) : (
          <>
            <ListingGrid listings={listings} />
            {hasMore && (
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={() => setPagesLoaded((p) => p + 1)}
                  className="btn-secondary"
                >
                  Show more
                </button>
              </div>
            )}
          </>
        )}
      </Container>

      <FilterModal open={filtersOpen} onClose={() => setFiltersOpen(false)} />
    </>
  );
}

function SortSelect({ current, paramsString }: { current: string; paramsString: string }) {
  const router = useRouter();
  return (
    <select
      value={current}
      onChange={(e) => {
        const next = new URLSearchParams(paramsString);
        next.set("sort", e.target.value);
        router.push(`/?${next.toString()}`);
      }}
      className="rounded-lg border border-hairline px-3 py-2 text-sm outline-none focus:border-ink"
      aria-label="Sort listings"
    >
      {SORT_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <SearchX className="h-10 w-10 text-ink-muted" />
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="max-w-md text-ink-muted">{subtitle}</p>
    </div>
  );
}
