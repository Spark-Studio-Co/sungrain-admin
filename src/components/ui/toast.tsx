"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";

type ToastInput = {
  title: string;
  description?: string;
  duration?: number;
  variant?: ToastVariant;
};

type ToastItem = Required<Pick<ToastInput, "title" | "variant">> &
  Pick<ToastInput, "description" | "duration"> & {
    id: string;
  };

type ToastContextValue = {
  toast: (input: ToastInput) => string;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const variantStyles: Record<
  ToastVariant,
  {
    icon: typeof CheckCircle2;
    iconClassName: string;
    accentClassName: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    iconClassName: "bg-[#eef5ef] text-[#2f6b4f]",
    accentClassName: "bg-[#2f6b4f]",
  },
  error: {
    icon: AlertTriangle,
    iconClassName: "bg-[#fff0ee] text-[#c24135]",
    accentClassName: "bg-[#c24135]",
  },
  info: {
    icon: Info,
    iconClassName: "bg-[#fff3e3] text-[#d6730c]",
    accentClassName: "bg-[#f38810]",
  },
};

function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const item: ToastItem = {
        id,
        title: input.title,
        description: input.description,
        duration: input.duration ?? 4200,
        variant: input.variant ?? "info",
      };

      setItems((current) => [item, ...current].slice(0, 4));

      timers.current.set(
        id,
        setTimeout(() => dismiss(id), item.duration)
      );

      return id;
    },
    [dismiss]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      dismiss,
      success: (title, description) =>
        toast({ title, description, variant: "success" }),
      error: (title, description) =>
        toast({ title, description, variant: "error", duration: 5600 }),
      info: (title, description) =>
        toast({ title, description, variant: "info" }),
    }),
    [dismiss, toast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-relevant="additions text"
        className="pointer-events-none fixed right-3 top-3 z-[100] flex w-[calc(100vw-1.5rem)] max-w-sm flex-col gap-2 sm:right-5 sm:top-5"
      >
        {items.map((item) => {
          const config = variantStyles[item.variant];
          const Icon = config.icon;

          return (
            <div
              key={item.id}
              className="pointer-events-auto relative overflow-hidden rounded-md border border-[#dfe7de] bg-white p-3 pr-10 shadow-[0_18px_42px_rgba(34,49,55,0.18)] animate-in slide-in-from-right-4 fade-in-0"
            >
              <div
                className={cn(
                  "absolute inset-y-0 left-0 w-1",
                  config.accentClassName
                )}
              />
              <div className="flex gap-3">
                <div
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-md",
                    config.iconClassName
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 pt-0.5">
                  <div className="text-sm font-black text-[#223137]">
                    {item.title}
                  </div>
                  {item.description ? (
                    <div className="mt-1 text-sm leading-5 text-[#6f7774]">
                      {item.description}
                    </div>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="absolute right-2 top-2 grid size-7 place-items-center rounded-md text-[#8a928f] transition hover:bg-[#f6f8f5] hover:text-[#223137] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f38810]/30"
              >
                <X className="size-4" />
                <span className="sr-only">Закрыть уведомление</span>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

function useToast() {
  const value = useContext(ToastContext);

  if (!value) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return value;
}

export { ToastProvider, useToast };
