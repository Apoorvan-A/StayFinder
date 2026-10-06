"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

import { DemoUserSwitcher } from "@/components/DemoUserSwitcher";
import { Logo } from "@/components/Logo";
import { SearchBar } from "@/components/search/SearchBar";
import { Container } from "@/components/ui/Container";

export function Navbar() {
  const pathname = usePathname();
  // The expandable search belongs on the explore/home experience.
  const showSearch = pathname === "/";

  return (
    <header className="sticky top-0 z-50 border-b border-divider bg-white">
      <Container>
        <div className="flex h-16 items-center justify-between gap-4 md:h-20">
          <div className="flex-shrink-0">
            <Logo />
          </div>

          <div className="hidden flex-1 justify-center md:flex">
            {showSearch && (
              <Suspense fallback={<div className="h-12 w-80 rounded-full border border-hairline" />}>
                <SearchBar />
              </Suspense>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/host"
              className="hidden rounded-full px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-surface lg:block"
            >
              Become a host
            </Link>
            <DemoUserSwitcher />
          </div>
        </div>

        {/* Mobile search row */}
        {showSearch && (
          <div className="pb-3 md:hidden">
            <Suspense fallback={<div className="h-12 w-full rounded-full border border-hairline" />}>
              <SearchBar variant="compact" />
            </Suspense>
          </div>
        )}
      </Container>
    </header>
  );
}
