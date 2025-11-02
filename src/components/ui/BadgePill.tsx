import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type BadgeTone = "objective" | "quarter" | "key" | "action";

const toneClassMap: Record<BadgeTone, string> = {
  objective: "bg-[var(--color-secondary-industrial)]/15 text-[var(--color-secondary-industrial)] dark:bg-[var(--color-secondary-industrial)]/25 dark:text-[var(--color-tertiary-ice)]",
  quarter: "bg-[var(--color-secondary-illumination)]/15 text-[var(--color-secondary-illumination)] dark:bg-[var(--color-secondary-illumination)]/25 dark:text-[var(--color-tertiary-ice)]",
  key: "bg-[var(--color-secondary-cerulean)]/15 text-[var(--color-secondary-cerulean)] dark:bg-[var(--color-secondary-cerulean)]/25 dark:text-[var(--color-tertiary-ice)]",
  action: "bg-[var(--color-primary)]/12 text-[var(--color-primary)] dark:bg-[var(--color-primary)]/25 dark:text-[var(--color-tertiary-ice)]",
};

interface BadgePillProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function BadgePill({ tone = "objective", className, children, ...props }: BadgePillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em]",
        toneClassMap[tone],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}


