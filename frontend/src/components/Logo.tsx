import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" aria-label="StayFinder home" className="flex items-center gap-2 text-brand">
      <svg viewBox="0 0 32 32" className="h-8 w-8 fill-current" aria-hidden="true">
        <path d="M16 1c2.6 0 4.7 2 5 4.5l.03.5c0 1.6-.5 3.3-1.8 6l-.5 1 .3.5c2.4 4 3.4 6 3.6 8 .3 2.9-1.6 5.4-4.4 5.9-1.3.2-2.6-.1-3.7-.8l-.8-.6-.8.6c-1 .7-2.3 1-3.6.8-2.8-.5-4.7-3-4.4-5.9.2-2 1.2-4 3.6-8l.3-.5-.5-1C7.5 9.3 7 7.6 7 6l.03-.5C7.3 3 9.4 1 12 1h4Zm0 2h-4c-1.6 0-2.8 1.2-3 2.8L9 6c0 1.2.4 2.6 1.6 5.1l.8 1.6-.6 1C8.1 19 7.3 20.7 7.2 22.2c-.2 1.8 1 3.3 2.7 3.6.9.2 1.8-.1 2.5-.7l1.6-1.3 1.6 1.3c.7.6 1.6.9 2.5.7 1.7-.3 2.9-1.8 2.7-3.6-.1-1.5-.9-3.2-3.6-7.5l-.6-1 .8-1.6C21.6 8.6 22 7.2 22 6l-.02-.2C21.8 4.2 20.6 3 19 3h-3Z" />
      </svg>
      <span className="hidden text-xl font-bold tracking-tight md:block">stayfinder</span>
    </Link>
  );
}
