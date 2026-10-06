import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  cta,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  cta?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-surface">
        <Icon className="h-7 w-7 text-ink-muted" />
      </div>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="max-w-md text-ink-muted">{subtitle}</p>
      {cta && (
        <Link href={cta.href} className="btn-primary mt-2">
          {cta.label}
        </Link>
      )}
    </div>
  );
}
