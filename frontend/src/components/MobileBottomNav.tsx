"use client";

import { Heart, LayoutDashboard, Luggage, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";

const ITEMS = [
  { href: "/", label: "Explore", icon: Search },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/trips", label: "Trips", icon: Luggage },
  { href: "/host", label: "Host", icon: LayoutDashboard },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-divider bg-white lg:hidden">
      <div className="mx-auto flex max-w-md items-center justify-around py-2">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 text-[11px]",
                active ? "text-brand" : "text-ink-muted",
              )}
            >
              <Icon className={cn("h-5 w-5", active && "fill-brand/10")} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
