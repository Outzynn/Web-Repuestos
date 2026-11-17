/** $45.000 — sin centavos, que es como se habla de los precios en el local. */
export function money(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const rounded = Math.round(value);
  return "$" + rounded.toLocaleString("es-AR");
}

/** Lee un importe escrito a mano: "45.000", "45000", "$45 000". */
export function parseMoney(text: string): number | null {
  const clean = text.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  if (!clean) return null;
  const value = Number(clean);
  return Number.isFinite(value) ? value : null;
}

const DAY = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): number {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy.getTime();
}

export type Period = "hoy" | "semana" | "mes" | "todo";

export const PERIODS: { id: Period; label: string }[] = [
  { id: "hoy", label: "Hoy" },
  { id: "semana", label: "7 dias" },
  { id: "mes", label: "30 dias" },
  { id: "todo", label: "Todo" },
];

/** Desde cuando cuenta un periodo. */
export function periodStart(period: Period, now = new Date()): number {
  if (period === "todo") return 0;
  const today = startOfDay(now);
  if (period === "hoy") return today;
  if (period === "semana") return today - 6 * DAY;
  return today - 29 * DAY;
}

export function inPeriod(iso: string, period: Period): boolean {
  const time = new Date(iso).getTime();
  return Number.isFinite(time) && time >= periodStart(period);
}

/** "Hoy 14:35", "Ayer 09:10" o "12/11 18:40". */
export function whenLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const hour = date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / DAY);
  if (days === 0) return "Hoy " + hour;
  if (days === 1) return "Ayer " + hour;
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }) + " " + hour;
}

/** Clave de dia para agrupar movimientos. */
export function dayKey(iso: string): string {
  const date = new Date(iso);
  return String(startOfDay(date));
}

export function dayLabel(key: string): string {
  const date = new Date(Number(key));
  const days = Math.round((startOfDay(new Date()) - Number(key)) / DAY);
  if (days === 0) return "Hoy";
  if (days === 1) return "Ayer";
  return date.toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "2-digit" });
}
