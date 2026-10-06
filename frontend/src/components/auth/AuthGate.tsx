"use client";

import { Home, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Container } from "@/components/ui/Container";
import { useAuth } from "@/hooks/useAuth";

export function AuthGate({
  children,
  requireHost = false,
  title = "Sign in to continue",
  subtitle = "Log in or use a demo account to access this page.",
}: {
  children: React.ReactNode;
  requireHost?: boolean;
  title?: string;
  subtitle?: string;
}) {
  const { user, isLoading, openAuthModal, becomeHost } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <Container className="py-16">
        <div className="skeleton h-72 w-full rounded-2xl" />
      </Container>
    );
  }

  if (!user) {
    return (
      <Prompt
        icon={<Lock className="h-7 w-7 text-ink-muted" />}
        title={title}
        subtitle={subtitle}
        cta="Log in or sign up"
        onClick={openAuthModal}
      />
    );
  }

  if (requireHost && user.role !== "host") {
    const enable = async () => {
      try {
        await becomeHost();
        toast.success("You're now set up to host");
        router.refresh();
      } catch {
        toast.error("Something went wrong. Please try again.");
      }
    };
    return (
      <Prompt
        icon={<Home className="h-7 w-7 text-ink-muted" />}
        title="Become a host"
        subtitle="Turn on hosting to create listings and open your host dashboard."
        cta="Become a host"
        onClick={enable}
      />
    );
  }

  return <>{children}</>;
}

function Prompt({
  icon,
  title,
  subtitle,
  cta,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <Container className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-surface">{icon}</div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="max-w-md text-ink-muted">{subtitle}</p>
      <button type="button" onClick={onClick} className="btn-primary mt-2">
        {cta}
      </button>
    </Container>
  );
}
