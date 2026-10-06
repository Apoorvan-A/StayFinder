import Link from "next/link";

import { cn } from "@/lib/cn";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("fill-current", className)} aria-hidden="true">
      {/* An arched doorway — an original "entrance / stay" mark. */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5 28V15a11 11 0 0 1 22 0v13a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-9a4 4 0 0 0-8 0v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1Z"
      />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" aria-label="StayFinder home" className={cn("flex items-center gap-2", className)}>
      <BrandMark className="h-7 w-7 text-brand" />
      <span className="hidden text-[22px] font-semibold tracking-tight text-brand md:block">
        StayFinder
      </span>
    </Link>
  );
}
