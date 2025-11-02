"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

type ToastVariant = "default" | "success" | "error" | "warning";

export type ToastMessage = {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastContextValue = {
  toast: (message: Omit<ToastMessage, "id">) => void;
  removeToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const DEFAULT_DURATION = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const removeToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current[id];
    if (timer) {
      clearTimeout(timer);
      delete timers.current[id];
    }
  }, []);

  const toast = useCallback(
    ({ duration, ...message }: Omit<ToastMessage, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const toastMessage: ToastMessage = {
        id,
        variant: message.variant ?? "default",
        ...message,
      };

      setToasts((current) => [...current, toastMessage]);

      const timeout = duration === 0 ? null : duration ?? DEFAULT_DURATION;
      if (timeout) {
        timers.current[id] = setTimeout(() => removeToast(id), timeout);
      }
    },
    [removeToast]
  );

  useEffect(() => {
    return () => {
      Object.values(timers.current).forEach(clearTimeout);
      timers.current = {};
    };
  }, []);

  const value = useMemo(() => ({ toast, removeToast }), [toast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex max-w-sm flex-col gap-3">
        {toasts.map((item) => (
          <ToastItem key={item.id} message={item} onDismiss={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function ToastItem({
  message,
  onDismiss,
}: {
  message: ToastMessage;
  onDismiss: (id: string) => void;
}) {
  const { id, title, description, variant = "default" } = message;

  const variantStyles: Record<ToastVariant, string> = {
    default: "bg-[var(--color-primary)] text-white dark:bg-[var(--color-secondary-industrial)] dark:text-[var(--color-neutral-900)]",
    success: "bg-[#1f7b5c] text-white",
    error: "bg-[#b93c35] text-white",
    warning: "bg-[var(--color-secondary-illumination)] text-white",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg px-4 py-3 shadow-lg shadow-[var(--shadow-lg)] transition-all",
        variantStyles[variant]
      )}
      role="status"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          {title && <p className="text-sm font-semibold">{title}</p>}
          {description && <p className="text-sm text-white/90">{description}</p>}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(id)}
          className="text-sm text-white/70 transition hover:text-white"
          aria-label="Chiudi notifica"
        >
          ×
        </button>
      </div>
    </div>
  );
}


