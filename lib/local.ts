import { EMPTY, type Product, type Snapshot } from "./types";

const KEY = "kylobyte.v1";
/** Clave de la version anterior (solo repuestos): se migra una sola vez. */
const OLD_KEY = "repuestos.v1";

function fromOld(): Snapshot | null {
  try {
    const raw = window.localStorage.getItem(OLD_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as {
      parts?: (Partial<Product> & { id: string; name: string })[];
      items?: Snapshot["items"];
    };
    const products: Product[] = (data.parts ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category ?? "",
      qty: p.qty ?? 0,
      cost: p.cost ?? null,
      price: p.price ?? null,
      barcode: null,
      note: p.note ?? null,
      createdAt: p.createdAt ?? new Date().toISOString(),
    }));
    return { ...EMPTY, products, items: data.items ?? [] };
  } catch {
    return null;
  }
}

export function loadLocal(): Snapshot {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const data = JSON.parse(raw) as Partial<Snapshot>;
      return {
        products: data.products ?? [],
        sales: data.sales ?? [],
        jobs: data.jobs ?? [],
        items: data.items ?? [],
      };
    }
    return fromOld() ?? EMPTY;
  } catch {
    return EMPTY;
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
