"use client";

import { useEffect, useState } from "react";
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
        <div className="min-w-0">
          <h1 className="text-[28px] font-bold leading-tight tracking-tight">{title}</h1>
          {subtitle && <p className="mt-0.5 truncate text-[13px] text-muted">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {right}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

/** Boton redondo con un "+" para el encabezado. */
export function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white shadow-sm active:scale-95"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
    </button>
  );
}

/** Lupa del encabezado: al tocarla se despliega la barra de busqueda. */
export function SearchButton({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? "Cerrar busqueda" : "Buscar"}
      aria-expanded={open}
      className={
        "flex h-9 w-9 items-center justify-center rounded-full border border-line active:scale-95 " +
        (open ? "bg-brand text-white" : "bg-card text-ink")
      }
    >
      {open ? (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        >
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      ) : (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      )}
    </button>
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

/** Fila de opciones scrolleable: periodos, medios de pago, categorias. */
export function Chips({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (next: string) => void;
}) {
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
              (active ? "bg-brand text-white" : "border border-line bg-card text-ink")
            }
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-line bg-card px-3 py-3 text-[17px] outline-none placeholder:text-muted focus:ring-2 focus:ring-brand/40";

/** Campo con etiqueta chica arriba. Todo opcional salvo lo que diga la pantalla. */
export function Field({
  label,
  value,
  onChange,
  placeholder,
  money,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  money?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block px-1 text-[12px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </span>
      <div className="relative">
        {money && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[17px] text-muted">
            $
          </span>
        )}
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          inputMode={money ? "numeric" : undefined}
          autoFocus={autoFocus}
          autoComplete="off"
          className={money ? inputClass + " pl-7" : inputClass}
        />
      </div>
    </label>
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
      <div className="safe-sheet relative z-10 max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border-t border-line bg-app p-4 shadow-2xl">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" />
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="truncate text-[20px] font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="text-[15px] font-medium text-brand">
            Listo
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  tone = "brand",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "brand" | "ok";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        "w-full rounded-xl py-3.5 text-[17px] font-semibold text-white disabled:opacity-40 " +
        (tone === "ok" ? "bg-ok" : "bg-brand")
      }
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  tone = "brand",
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone?: "brand" | "danger" | "muted";
}) {
  const color =
    tone === "danger"
      ? "border-danger/30 text-danger"
      : tone === "muted"
        ? "border-line text-muted"
        : "border-line text-brand";
  return (
    <button
      type="button"
      onClick={onClick}
      className={"w-full rounded-xl border bg-card py-3.5 text-[16px] font-semibold " + color}
    >
      {children}
    </button>
  );
}

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 2400);
    return () => clearTimeout(timer);
  }, [message]);

  const toast = message ? (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-6">
      <div className="rounded-full bg-ink/90 px-4 py-2 text-center text-[14px] font-medium text-app shadow-lg">
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

/** Interruptor de si/no para las pocas cosas que son si o no. */
export function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      aria-pressed={value}
      className="flex w-full items-center justify-between rounded-xl border border-line bg-card px-3 py-3 text-left"
    >
      <span className="text-[16px] font-medium">{label}</span>
      <span
        className={
          "relative h-7 w-12 shrink-0 rounded-full transition " + (value ? "bg-ok" : "bg-line")
        }
      >
        <span
          className={
            "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all " +
            (value ? "left-[22px]" : "left-0.5")
          }
        />
      </span>
    </button>
  );
}
