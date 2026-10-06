import Link from "next/link";

import { Container } from "@/components/ui/Container";

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-6xl font-bold text-brand">404</p>
      <h1 className="text-2xl font-semibold">We can&apos;t find that page</h1>
      <p className="max-w-md text-ink-muted">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <Link href="/" className="btn-primary mt-2">
        Back to explore
      </Link>
    </Container>
  );
}
