"use client";

import { Compass, Home } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { BrandMark } from "@/components/Logo";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { Role } from "@/types";

export function AuthModal() {
  const { authModalOpen, closeAuthModal, googleClientId, loginDemo, loginWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);

  const handleGoogle = async (credential: string) => {
    setBusy(true);
    try {
      await loginWithGoogle(credential);
      toast.success("Welcome to StayFinder");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Sign-in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleDemo = async (role: Role) => {
    setBusy(true);
    try {
      await loginDemo(role);
      toast.success(role === "host" ? "Exploring as a demo host" : "Exploring as a demo guest");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't start the demo session.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={authModalOpen} onClose={closeAuthModal} title="Log in or sign up" size="md">
      <div className="mx-auto max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <BrandMark className="h-9 w-9 text-brand" />
          <h2 className="mt-3 text-xl font-semibold">Welcome to StayFinder</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Sign in to book stays, save favorites, and host your own place.
          </p>
        </div>

        {googleClientId ? (
          <div className="flex justify-center">
            <GoogleSignInButton clientId={googleClientId} onCredential={handleGoogle} />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-hairline px-4 py-3 text-center text-sm text-ink-muted">
            Google sign-in isn&apos;t configured on this server. Use a demo account below to
            explore the full experience.
          </div>
        )}

        <div className="my-5 flex items-center gap-3 text-xs text-ink-muted">
          <span className="h-px flex-1 bg-divider" />
          or continue instantly
          <span className="h-px flex-1 bg-divider" />
        </div>

        <div className="space-y-3">
          <DemoOption
            icon={<Compass className="h-5 w-5" />}
            title="Explore as a demo guest"
            subtitle="Browse, book, and manage trips"
            disabled={busy}
            onClick={() => handleDemo("guest")}
          />
          <DemoOption
            icon={<Home className="h-5 w-5" />}
            title="Explore as a demo host"
            subtitle="See the host dashboard and listings"
            disabled={busy}
            onClick={() => handleDemo("host")}
          />
        </div>
      </div>
    </Modal>
  );
}

function DemoOption({
  icon,
  title,
  subtitle,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-4 rounded-xl border border-hairline px-4 py-3 text-left transition hover:border-ink disabled:opacity-50"
    >
      <span className="grid h-10 w-10 place-items-center rounded-full bg-surface text-ink">{icon}</span>
      <span>
        <span className="block font-medium text-ink">{title}</span>
        <span className="block text-sm text-ink-muted">{subtitle}</span>
      </span>
    </button>
  );
}
