"use client";

import { useEffect, useState } from "react";
import { CATEGORIES } from "@/lib/types";
import { ThemeToggle } from "./Theme";

export function Header({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-app/80 px-4 pb-3 pt-6 backdrop-blur-xl">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-bold leading-tight tracking-tight">{title}</h1>
          {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {right}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export function Stepper({
  value,
  onChange,
  min = 0,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
}) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-app p-1">
      <button
        type="button"
        aria-label="Restar"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-xl font-semibold text-ink shadow-sm active:scale-95"
      >
        −
      </button>
      <span className="min-w-8 text-center text-[17px] font-semibold tabular-nums">{value}</span>
      <button
        type="button"
        aria-label="Sumar"
        onClick={() => onChange(value + 1)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-xl font-semibold text-brand shadow-sm active:scale-95"
      >
        +
      </button>
    </div>
  );
}

export function CategoryChips({
  value,
  onChange,
  includeAll = false,
}: {
  value: string;
  onChange: (next: string) => void;
  includeAll?: boolean;
}) {
  const options = includeAll ? ["Todos", ...CATEGORIES] : [...CATEGORIES];
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {options.map((option) => {
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={
              "shrink-0 rounded-full px-4 py-2 text-[14px] font-medium transition " +
              (active ? "bg-brand text-white" : "bg-card text-ink border border-line")
            }
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <div className="relative z-10 w-full max-w-md rounded-t-3xl border-t border-line bg-app p-4 pb-8 shadow-2xl">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" />
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[20px] font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="text-[15px] font-medium text-brand">
            Listo
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 2200);
    return () => clearTimeout(timer);
  }, [message]);

  const toast = message ? (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-6">
      <div className="rounded-full bg-ink/90 px-4 py-2 text-[14px] font-medium text-app shadow-lg">
        {message}
      </div>
    </div>
  ) : null;

  return { toast, show: setMessage };
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-card/60 px-6 py-10 text-center">
      <p className="text-[16px] font-semibold">{title}</p>
      {hint && <p className="mt-1 text-[13px] text-muted">{hint}</p>}
    </div>
  );
}
