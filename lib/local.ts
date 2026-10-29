import type { Snapshot } from "./types";

const KEY = "repuestos.v1";

export function loadLocal(): Snapshot {
  if (typeof window === "undefined") return { parts: [], items: [] };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { parts: [], items: [] };
    const data = JSON.parse(raw) as Snapshot;
    return { parts: data.parts ?? [], items: data.items ?? [] };
  } catch {
    return { parts: [], items: [] };
  }
}

export function saveLocal(snapshot: Snapshot): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch {
    /* almacenamiento lleno o bloqueado: seguimos en memoria */
  }
}
