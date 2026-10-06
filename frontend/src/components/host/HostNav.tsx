"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";
import { useAuth } from "@/hooks/useAuth";

const TABS = [
  { href: "/host", label: "Dashboard", exact: true },
  { href: "/host/listings", label: "Listings", exact: false },
  { href: "/host/reservations", label: "Reservations", exact: false },
];

export function HostNav() {
  const pathname = usePathname();
  const { user: currentUser } = useAuth();

  return (
    <div className="border-b border-divider">
      <div className="flex items-center justify-between">
        <nav className="flex gap-6">
          {TABS.map((tab) => {
            const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "border-b-2 pb-3 pt-1 text-sm font-medium transition",
                  active ? "border-ink text-ink" : "border-transparent text-ink-muted hover:text-ink",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
        {currentUser && (
          <p className="hidden pb-3 text-sm text-ink-muted sm:block">
            Viewing as <span className="font-medium text-ink">{currentUser.name}</span>
          </p>
        )}
      </div>
    </div>
  );
}
