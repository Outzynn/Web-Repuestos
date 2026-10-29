export const CATEGORIES = [
  "Celular",
  "Notebook",
  "Joystick",
  "Consola",
  "Otro",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type Part = {
  id: string;
  name: string;
  category: string;
  qty: number;
  price: number | null;
  note: string | null;
  createdAt: string;
};

export type ShoppingItem = {
  id: string;
  name: string;
  qty: number;
  note: string | null;
  done: boolean;
  createdAt: string;
};

export type Snapshot = { parts: Part[]; items: ShoppingItem[] };

export type Mode = "cloud" | "local" | "unknown";

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Normaliza un nombre para comparar "Modulo A25" con "módulo a25". */
export function keyOf(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
