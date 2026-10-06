"use client";

import { Minus, Plus } from "lucide-react";

import { cn } from "@/lib/cn";

export function GuestStepper({
  value,
  onChange,
  min = 1,
  max = 16,
  label = "Guests",
  sublabel,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
  sublabel?: string;
}) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  const StepButton = ({
    onClick,
    disabled,
    children,
    ariaLabel,
  }: {
    onClick: () => void;
    disabled: boolean;
    children: React.ReactNode;
    ariaLabel: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-full border border-ink-muted text-ink-muted transition",
        disabled ? "opacity-40" : "hover:border-ink hover:text-ink",
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-ink">{label}</p>
        {sublabel && <p className="text-sm text-ink-muted">{sublabel}</p>}
      </div>
      <div className="flex items-center gap-3">
        <StepButton onClick={dec} disabled={value <= min} ariaLabel="Decrease guests">
          <Minus className="h-4 w-4" />
        </StepButton>
        <span className="w-6 text-center tabular-nums">{value}</span>
        <StepButton onClick={inc} disabled={value >= max} ariaLabel="Increase guests">
          <Plus className="h-4 w-4" />
        </StepButton>
      </div>
    </div>
  );
}
