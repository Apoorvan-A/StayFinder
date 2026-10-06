import { Container } from "@/components/ui/Container";

export function Footer() {
  return (
    <footer className="mt-12 border-t border-divider bg-surface">
      <Container className="py-8">
        <div className="flex flex-col items-center justify-between gap-4 text-sm text-ink-muted md:flex-row">
          <p>© {new Date().getFullYear()} StayFinder. Demo project — not a real booking service.</p>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="cursor-default">Privacy</span>
            <span className="cursor-default">Terms</span>
            <span className="cursor-default">Sitemap</span>
            <span className="cursor-default">English (US)</span>
            <span className="cursor-default">$ USD</span>
          </nav>
        </div>
      </Container>
    </footer>
  );
}
