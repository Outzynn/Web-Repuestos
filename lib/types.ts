/** Medios de pago que se usan en el local. */
export const PAY_METHODS = ["Efectivo", "Transferencia", "Tarjeta", "Otro"] as const;
export type PayMethod = (typeof PAY_METHODS)[number];

/** Producto del stock: lo unico obligatorio es el nombre. */
export type Product = {
  id: string;
  name: string;
  category: string;
  qty: number;
  cost: number | null;
  price: number | null;
  barcode: string | null;
  note: string | null;
  createdAt: string;
};

/** Un renglon de una venta. Guarda el precio y el costo del momento. */
export type SaleLine = {
  productId: string | null;
  name: string;
  qty: number;
  price: number;
  cost: number | null;
};

export type Sale = {
  id: string;
  lines: SaleLine[];
  total: number;
  cost: number;
  pay: PayMethod;
  note: string | null;
  createdAt: string;
};

/** Trabajo de servicio tecnico: entra un equipo, se arregla, se entrega. */
export type JobStatus = "taller" | "listo" | "entregado";

/** Facu cobra a veces un porcentaje de la ganancia y a veces un monto fijo. */
export type FacuKind = "porcentaje" | "monto";

export type Job = {
  id: string;
  device: string;
  customer: string | null;
  issue: string | null;
  partsCost: number | null;
  charged: number | null;
  status: JobStatus;
  paid: boolean;
  facuKind: FacuKind | null;
  facuValue: number | null;
  facuPaid: boolean;
  note: string | null;
  closedAt: string | null;
  createdAt: string;
};

/** Un repuesto se usa en una reparacion; un producto va al stock para vender. */
export type ItemKind = "repuesto" | "producto";

/** Lista de lo que hay que comprarle al proveedor. */
export type ShoppingItem = {
  id: string;
  name: string;
  kind: ItemKind;
  qty: number;
  note: string | null;
  done: boolean;
  createdAt: string;
};

export type Snapshot = {
  products: Product[];
  sales: Sale[];
  jobs: Job[];
  items: ShoppingItem[];
};

export const EMPTY: Snapshot = { products: [], sales: [], jobs: [], items: [] };

export type Mode = "cloud" | "local" | "unknown";

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Normaliza texto para comparar "Modulo A25" con "módulo a25". */
export function keyOf(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Ganancia de una venta. */
export function saleProfit(sale: Sale): number {
  return sale.total - sale.cost;
}

/** Lo que dejo un trabajo de service: cobrado menos el repuesto. */
export function jobProfit(job: Job): number {
  return (job.charged ?? 0) - (job.partsCost ?? 0);
}

/** La parte de Facu: un porcentaje de esa ganancia o un monto fijo. */
export function facuCut(job: Job): number {
  if (!job.facuKind || job.facuValue === null) return 0;
  if (job.facuKind === "monto") return job.facuValue;
  return Math.round((jobProfit(job) * job.facuValue) / 100);
}

/** Lo que queda para el local despues de pagarle a Facu. */
export function shopProfit(job: Job): number {
  return jobProfit(job) - facuCut(job);
}

/** Busca un producto por nombre o por codigo de barras. */
export function findProduct(products: Product[], text: string): Product | null {
  const key = keyOf(text);
  if (!key) return null;
  return (
    products.find((p) => p.barcode && keyOf(p.barcode) === key) ??
    products.find((p) => keyOf(p.name) === key) ??
    null
  );
}
