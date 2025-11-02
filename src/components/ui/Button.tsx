import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

    const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
      primary:
        "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] focus:ring-[var(--ring-brand)] focus:ring-offset-[var(--color-tertiary-ice)] shadow-md dark:bg-[var(--color-primary-dark)] dark:text-[var(--color-neutral-900)] dark:hover:bg-[var(--color-secondary-industrial)] dark:focus:ring-[var(--color-secondary-industrial)]",
      secondary:
        "bg-[var(--color-secondary-cerulean)] text-[var(--color-primary)] hover:bg-[#8fa5c7] focus:ring-[var(--color-secondary-industrial)] focus:ring-offset-[var(--color-tertiary-ice)] dark:bg-[var(--color-secondary-industrial)] dark:text-[var(--color-neutral-900)] dark:hover:bg-[#3f6dab]",
      outline:
        "border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-tertiary-ice)] focus:ring-[var(--color-secondary-cerulean)] focus:ring-offset-[var(--color-tertiary-ice)] dark:border-[var(--color-secondary-cerulean)] dark:text-[var(--color-neutral-900)] dark:hover:bg-[var(--color-secondary-industrial)]/30",
      ghost:
        "bg-transparent text-[var(--color-primary)] hover:bg-[var(--color-neutral-100)] focus:ring-[var(--color-secondary-cerulean)] focus:ring-offset-[var(--color-tertiary-ice)] dark:text-[var(--color-neutral-700)] dark:hover:bg-[var(--color-secondary-industrial)]/25 dark:focus:ring-offset-[var(--color-tertiary-ice)]",
    };

    const sizes = {
      sm: "rounded-[var(--radius-sm)] px-3 py-1.5 text-sm",
      md: "rounded-[var(--radius-md)] px-4 py-2 text-sm",
      lg: "rounded-[var(--radius-lg)] px-6 py-3 text-base",
    } satisfies Record<NonNullable<ButtonProps["size"]>, string>;

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

