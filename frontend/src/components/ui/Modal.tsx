"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

import { cn } from "@/lib/cn";

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
  fullScreenOnMobile = false,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "md" | "lg" | "xl";
  fullScreenOnMobile?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "flex max-h-full w-full flex-col overflow-hidden bg-white shadow-card animate-fade-in",
          fullScreenOnMobile ? "h-full sm:h-auto sm:max-h-[90vh] sm:rounded-2xl" : "rounded-2xl",
          "sm:max-h-[90vh]",
          size === "md" && "sm:max-w-lg",
          size === "lg" && "sm:max-w-2xl",
          size === "xl" && "sm:max-w-5xl",
        )}
      >
        {(title || true) && (
          <div className="flex items-center justify-between border-b border-divider px-4 py-3">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface"
            >
              <X className="h-5 w-5" />
            </button>
            {title && <h2 className="text-base font-semibold">{title}</h2>}
            <span className="h-8 w-8" />
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
        {footer && <div className="border-t border-divider px-4 py-3">{footer}</div>}
      </div>
    </div>
  );
}
