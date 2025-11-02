import { forwardRef, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, id, children, ...props }, ref) => {
    const errorId = id ? `${id}-error` : undefined;

    return (
      <div className={cn("relative w-full", className)}>
        <select
          ref={ref}
          id={id}
          className={cn(
            "w-full appearance-none border-none bg-transparent px-0 py-2 text-sm text-[var(--color-primary)] transition-colors",
            "placeholder:text-[var(--color-neutral-400)] focus:outline-none focus:ring-0",
            "border-b border-[var(--color-neutral-200)] focus:border-[var(--color-secondary-cerulean)] dark:border-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)] dark:focus:border-[var(--color-secondary-industrial)]",
            error && "border-rose-400 dark:border-[#ff9d9d]",
            "pr-8 cursor-pointer"
          )}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? errorId : undefined}
          {...props}
        >
          {children}
        </select>
        <svg
          className="pointer-events-none absolute right-1 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-neutral-500)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        {error && errorId && (
          <p id={errorId} className="mt-1 text-xs text-rose-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";


