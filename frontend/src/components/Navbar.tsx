"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { AccountMenu } from "@/components/AccountMenu";
import { Logo } from "@/components/Logo";
import { SearchBar } from "@/components/search/SearchBar";
import { Container } from "@/components/ui/Container";

export function Navbar() {
  const pathname = usePathname();
  const [searchCompact, setSearchCompact] = useState(false);
  // The expandable search belongs on the explore/home experience.
  const showSearch = pathname === "/";

  useEffect(() => {
    let frame = 0;
    let compact = false;
    const update = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        const nextCompact = compact ? y > 48 : y > 112;
        if (nextCompact !== compact) {
          compact = nextCompact;
          setSearchCompact(nextCompact);
        }
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-divider bg-white">
      <Container size="wide">
        <div className="flex h-16 items-center gap-4 md:h-20">
          <div className="flex flex-1 items-center">
            <Logo />
          </div>

          {showSearch && (
            <div className="hidden w-full max-w-[560px] flex-shrink-0 lg:block xl:max-w-[820px]">
              <Suspense fallback={<div className="mx-auto h-14 w-full rounded-full border border-hairline" />}>
                <SearchBar compact={searchCompact} />
              </Suspense>
            </div>
          )}

          <div className="flex flex-1 items-center justify-end gap-2">
            <Link
              href="/host"
              className="hidden rounded-full px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-surface lg:block"
            >
              Become a host
            </Link>
            <AccountMenu />
          </div>
        </div>

        {/* Compact search row for mobile and tablet (the large search shows at lg+). */}
        {showSearch && (
          <div className="pb-3 lg:hidden">
            <Suspense fallback={<div className="h-12 w-full rounded-full border border-hairline" />}>
              <SearchBar variant="compact" />
            </Suspense>
          </div>
        )}
      </Container>
    </header>
  );
}
