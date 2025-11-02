"use client";

import { ReactNode, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  showCloseButton?: boolean;
}

export function Modal({ isOpen, onClose, title, children, size = "md", showCloseButton = true }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div className="fixed inset-0 bg-[var(--color-neutral-900)]/40 backdrop-blur-sm" aria-hidden="true" />
      <div
        className={cn(
          "relative z-50 w-full rounded-[var(--radius-xl)] border border-[var(--color-neutral-200)] bg-[var(--surface)] p-6 shadow-[var(--shadow-lg)] backdrop-blur dark:border-[var(--color-neutral-100)] dark:bg-[var(--surface-muted)]",
          sizes[size]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h2 id="modal-title" className="text-lg font-semibold text-[var(--color-primary)]">
              {title}
            </h2>
            {showCloseButton && (
              <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close modal">
                ×
              </Button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

