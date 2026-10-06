import { Star } from "lucide-react";

import { cn } from "@/lib/cn";
import { formatRating } from "@/lib/format";

export function StarRating({
  rating,
  reviewCount,
  className,
  showCount = false,
}: {
  rating: number;
  reviewCount?: number;
  className?: string;
  showCount?: boolean;
}) {
  if (!rating) {
    return <span className={cn("text-sm text-ink-muted", className)}>New</span>;
  }
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm text-ink", className)}>
      <Star className="h-3.5 w-3.5 fill-ink text-ink" aria-hidden="true" />
      <span className="font-medium">{formatRating(rating)}</span>
      {showCount && reviewCount != null && (
        <span className="text-ink-muted">({reviewCount})</span>
      )}
    </span>
  );
}
