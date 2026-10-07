"use client";

import dynamic from "next/dynamic";

import type { ListingCard } from "@/types";

const ResultsMapInner = dynamic(() => import("@/components/map/ResultsMapInner"), {
  ssr: false,
  loading: () => <div className="skeleton h-full w-full" />,
});

export function ResultsMap(props: {
  listings: ListingCard[];
  activeId: number | null;
  onSelect: (id: number | null) => void;
}) {
  return (
    <div className="h-full w-full overflow-hidden">
      <ResultsMapInner {...props} />
    </div>
  );
}
