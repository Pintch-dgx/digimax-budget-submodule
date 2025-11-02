import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, id, ...props }, ref) => {
    const errorId = id ? `${id}-error` : "input-error";
    return (
      <div className="w-full">
        <input
          ref={ref}
          id={id}
          className={cn(
            "w-full border-b border-[var(--color-neutral-200)] bg-transparent px-0 py-2 text-sm text-[var(--color-primary)] transition-colors",
            "placeholder:text-[var(--color-neutral-400)] focus:border-[var(--color-secondary-cerulean)] focus:outline-none",
            "dark:border-[var(--color-neutral-500)] dark:text-[var(--color-tertiary-ice)] dark:placeholder:text-[var(--color-tertiary-ice)]/70 dark:focus:border-[var(--color-secondary-industrial)]",
            error && "border-rose-400 dark:border-[#ff9d9d]",
            className
          )}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? errorId : undefined}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-1 text-xs text-rose-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

