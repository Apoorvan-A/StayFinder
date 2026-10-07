"use client";

import { Compass, Heart, Home, LayoutDashboard, Luggage, Menu, MessageCircle, UserCircle } from "lucide-react";
import { SafeImage as Image } from "@/components/SafeImage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/cn";
import { useAuth } from "@/hooks/useAuth";
import type { Role } from "@/types";

export function AccountMenu() {
  const { user, isAuthenticated, openAuthModal, loginDemo, logout, becomeHost } = useAuth();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const close = () => setOpen(false);

  const handleDemo = async (role: Role) => {
    close();
    try {
      await loginDemo(role);
      toast.success(role === "host" ? "Exploring as a demo host" : "Exploring as a demo guest");
    } catch {
      toast.error("Couldn't start the demo session.");
    }
  };

  const handleBecomeHost = async () => {
    close();
    try {
      await becomeHost();
      toast.success("You're now set up to host");
      router.push("/host");
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  const handleLogout = async () => {
    close();
    await logout();
    toast.success("Signed out");
    router.push("/");
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-3 rounded-full border border-hairline py-1.5 pl-3 pr-1.5 transition hover:shadow-soft"
        aria-label="Account menu"
        aria-expanded={open}
      >
        <Menu className="h-4 w-4 text-ink" />
        {isAuthenticated && user?.avatar_url ? (
          <Image
            src={user.avatar_url}
            alt={user.name}
            width={30}
            height={30}
            className="h-[30px] w-[30px] rounded-full object-cover"
          />
        ) : (
          <UserCircle className="h-[30px] w-[30px] text-ink-muted" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-divider bg-white py-2 shadow-card">
          {isAuthenticated && user ? (
            <>
              <div className="px-4 py-2">
                <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                <p className="truncate text-xs text-ink-muted">{user.email}</p>
              </div>
              <Divider />
              <Item href="/trips" icon={<Luggage className="h-4 w-4" />} label="Trips" onClick={close} />
              <Item href="/wishlist" icon={<Heart className="h-4 w-4" />} label="Wishlists" onClick={close} />
              <Item href="/messages" icon={<MessageCircle className="h-4 w-4" />} label="Messages" onClick={close} />
              <Divider />
              {user.role === "host" ? (
                <Item href="/host" icon={<LayoutDashboard className="h-4 w-4" />} label="Host dashboard" onClick={close} />
              ) : (
                <Action icon={<Home className="h-4 w-4" />} label="Become a host" onClick={handleBecomeHost} />
              )}
              <Divider />
              <Action label="Log out" onClick={handleLogout} />
            </>
          ) : (
            <>
              <Action label="Log in or sign up" bold onClick={() => { close(); openAuthModal(); }} />
              <Divider />
              <Action icon={<Compass className="h-4 w-4" />} label="Explore as demo guest" onClick={() => handleDemo("guest")} />
              <Action icon={<Home className="h-4 w-4" />} label="Explore as demo host" onClick={() => handleDemo("host")} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Divider() {
  return <div className="my-2 h-px bg-divider" />;
}

function Item({
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
    <Link href={href} onClick={onClick} className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink transition hover:bg-surface">
      <span className="text-ink-muted">{icon}</span>
      {label}
    </Link>
  );
}

function Action({
  icon,
  label,
  onClick,
  bold,
}: {
  icon?: React.ReactNode;
  label: string;
  onClick: () => void;
  bold?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-ink transition hover:bg-surface",
        bold && "font-semibold",
      )}
    >
      {icon && <span className="text-ink-muted">{icon}</span>}
      {label}
    </button>
  );
}
