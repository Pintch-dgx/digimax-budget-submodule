import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

export function Badge({ variant = "default", className, ...props }: BadgeProps) {
  const variants: Record<NonNullable<BadgeProps["variant"]>, string> = {
    default: "bg-[var(--color-tertiary-ice)] text-[var(--color-primary)] dark:bg-[var(--color-secondary-industrial)]/20 dark:text-[var(--color-neutral-800)]",
    success: "bg-[#d8f1e6] text-[#1f7b5c]",
    warning: "bg-[#ff6b35] text-white shadow-md font-bold animate-pulse", // Colore arancione intenso con testo bianco e animazione per maggiore visibilità
    danger: "bg-[#fbe2e0] text-[#b93c35]",
    info: "bg-[#d7e1f3] text-[var(--color-secondary-industrial)] dark:bg-[var(--color-secondary-industrial)]/25 dark:text-[var(--color-neutral-900)]",
  };

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-wide",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}


