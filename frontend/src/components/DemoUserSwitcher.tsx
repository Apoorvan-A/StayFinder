"use client";

import { Check, Globe, Heart, LayoutDashboard, Luggage, Menu, UserCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";
import { useDemoUser } from "@/hooks/useDemoUser";

export function DemoUserSwitcher() {
  const { users, currentUser, setUser } = useDemoUser();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-3 rounded-full border border-hairline py-1.5 pl-3 pr-1.5 transition hover:shadow-soft"
        aria-label="Account and demo user menu"
      >
        <Menu className="h-4 w-4 text-ink" />
        {currentUser?.avatar_url ? (
          <Image
            src={currentUser.avatar_url}
            alt={currentUser.name}
            width={30}
            height={30}
            className="h-[30px] w-[30px] rounded-full object-cover"
          />
        ) : (
          <UserCircle className="h-[30px] w-[30px] text-ink-muted" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-divider bg-white py-2 shadow-card">
          <div className="px-4 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Switch demo user
            </p>
          </div>
          {users.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => {
                setUser(user.id);
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-2 text-left transition hover:bg-surface"
            >
              {user.avatar_url ? (
                <Image
                  src={user.avatar_url}
                  alt={user.name}
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <UserCircle className="h-9 w-9 text-ink-muted" />
              )}
              <span className="flex-1">
                <span className="block text-sm font-medium text-ink">{user.name}</span>
                <span className="block text-xs capitalize text-ink-muted">
                  {user.role}
                  {user.is_superhost ? " · Superhost" : ""}
                </span>
              </span>
              {currentUser?.id === user.id && <Check className="h-4 w-4 text-brand" />}
            </button>
          ))}

          <div className="my-2 h-px bg-divider" />
          <MenuLink href="/trips" icon={<Luggage className="h-4 w-4" />} label="My Trips" onClick={() => setOpen(false)} />
          <MenuLink href="/wishlist" icon={<Heart className="h-4 w-4" />} label="Wishlist" onClick={() => setOpen(false)} />
          <MenuLink href="/host" icon={<LayoutDashboard className="h-4 w-4" />} label="Host dashboard" onClick={() => setOpen(false)} />
          <MenuLink href="/" icon={<Globe className="h-4 w-4" />} label="Explore stays" onClick={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn("flex items-center gap-3 px-4 py-2.5 text-sm text-ink transition hover:bg-surface")}
    >
      <span className="text-ink-muted">{icon}</span>
      {label}
    </Link>
  );
}
