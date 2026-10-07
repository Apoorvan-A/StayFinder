"use client";

import { SlidersHorizontal } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";

import { cn } from "@/lib/cn";
import { fetcher } from "@/lib/api";
import { resolveIcon } from "@/lib/icons";

export function CategoryRow({ onOpenFilters, activeFilterCount }: { onOpenFilters: () => void; activeFilterCount: number }) {
  const { data: categories } = useSWR<string[]>("/api/categories", fetcher);
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const active = params.get("category");

  const select = (category: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (category) next.set("category", category);
    else next.delete("category");
    router.push(`${pathname}?${next.toString()}`);
  };

  const all = ["All", ...(categories ?? [])];

  return (
    // 3-column grid: equal 1fr spacers on both sides page-center the category group,
    // while Filters stays anchored in the right column. The center column shrinks and
    // scrolls when the categories no longer fit, instead of compressing them.
    <div className="grid grid-cols-[1fr_minmax(0,auto)_1fr] items-center gap-4">
      <div aria-hidden />

      <nav
        aria-label="Browse by category"
        className="no-scrollbar edge-fade-x flex min-w-0 items-center gap-7 overflow-x-auto py-4"
      >
        {all.map((category) => {
          const key = category === "All" ? null : category;
          const isActive = category === "All" ? !active : active === category;
          const Icon = resolveIcon(category === "All" ? "Trending" : category);
          return (
            <button
              key={category}
              type="button"
              onClick={() => select(key)}
              aria-pressed={isActive}
              className={cn(
                "flex min-w-fit flex-col items-center gap-2 border-b-2 pb-2 text-xs transition",
                isActive
                  ? "border-ink text-ink"
                  : "border-transparent text-ink-muted hover:border-hairline hover:text-ink",
              )}
            >
              <Icon className="h-6 w-6" />
              <span className="whitespace-nowrap font-medium">{category}</span>
            </button>
          );
        })}
      </nav>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onOpenFilters}
          className="flex flex-shrink-0 items-center gap-2 rounded-xl border border-hairline bg-white px-4 py-2.5 text-sm font-medium transition hover:border-ink"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="grid h-5 w-5 place-items-center rounded-full bg-ink text-xs text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
