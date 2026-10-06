import { Globe } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/ui/Container";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "/help" },
      { label: "Cancellation options", href: "/help#cancellations" },
    ],
  },
  {
    title: "Hosting",
    links: [
      { label: "Become a host", href: "/host" },
      { label: "List your place", href: "/host/listings/new" },
    ],
  },
  {
    title: "Discover",
    links: [
      { label: "Explore stays", href: "/" },
      { label: "Wishlists", href: "/wishlist" },
      { label: "My trips", href: "/trips" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-12 border-t border-divider bg-surface">
      <Container size="wide" className="py-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="mb-3 text-sm font-semibold text-ink">{col.title}</h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-ink-muted hover:text-ink hover:underline">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-divider pt-6 text-sm text-ink-muted md:flex-row">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>© {new Date().getFullYear()} StayFinder</span>
            <span className="hidden md:inline" aria-hidden>·</span>
            <Link href="/privacy" className="hover:text-ink hover:underline">Privacy</Link>
            <Link href="/terms" className="hover:text-ink hover:underline">Terms</Link>
          </div>
          {/* Informational labels — locale/currency aren't configurable in this demo. */}
          <div className="flex items-center gap-4 text-ink">
            <span className="flex items-center gap-1.5 font-medium">
              <Globe className="h-4 w-4" /> English (US)
            </span>
            <span className="font-medium">$ USD</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
