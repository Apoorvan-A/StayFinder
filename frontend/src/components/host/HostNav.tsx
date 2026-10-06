"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";

const TABS = [
  { href: "/host", label: "Dashboard", exact: true },
  { href: "/host/listings", label: "Listings", exact: false },
  { href: "/host/reservations", label: "Reservations", exact: false },
  { href: "/messages", label: "Messages", exact: false },
];

export function HostNav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-divider">
      <nav className="no-scrollbar flex gap-6 overflow-x-auto">
        {TABS.map((tab) => {
          const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "whitespace-nowrap border-b-2 pb-3 pt-1 text-sm font-medium transition",
                active ? "border-ink text-ink" : "border-transparent text-ink-muted hover:text-ink",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
