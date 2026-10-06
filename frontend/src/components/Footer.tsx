import { Globe } from "lucide-react";

import { Container } from "@/components/ui/Container";

const COLUMNS: { title: string; links: string[] }[] = [
  { title: "Support", links: ["Help Center", "Safety information", "Cancellation options", "Report a concern"] },
  { title: "Hosting", links: ["List your place", "Host resources", "Community forum", "Hosting responsibly"] },
  { title: "StayFinder", links: ["Newsroom", "Careers", "Investors", "Gift cards"] },
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
                  <li key={link}>
                    <span className="cursor-pointer text-sm text-ink-muted hover:text-ink hover:underline">
                      {link}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-divider pt-6 text-sm text-ink-muted md:flex-row">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>© {new Date().getFullYear()} StayFinder</span>
            <span className="hidden md:inline">·</span>
            <span className="cursor-pointer hover:underline">Privacy</span>
            <span className="cursor-pointer hover:underline">Terms</span>
            <span className="cursor-pointer hover:underline">Sitemap</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium text-ink">
              <Globe className="h-4 w-4" /> English (US)
            </span>
            <span className="font-medium text-ink">$ USD</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
