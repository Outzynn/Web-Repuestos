import type { Job, Product, Sale, ShoppingItem } from "./types";

export type ProductPatch = Partial<Omit<Product, "id" | "createdAt">>;
export type JobPatch = Partial<Omit<Job, "id" | "createdAt">>;
export type ItemPatch = Partial<Omit<ShoppingItem, "id" | "createdAt">>;

/**
 * Todo lo que la app puede cambiar. Viajan al servidor por /api/write en una
 * sola llamada: una venta, por ejemplo, es la venta mas el descuento de stock.
 */
export type Op =
  | { kind: "product.add"; product: Product }
  | { kind: "product.addMany"; products: Product[] }
  | { kind: "product.patch"; id: string; patch: ProductPatch }
  | { kind: "product.del"; id: string }
  | { kind: "sale.add"; sale: Sale }
  | { kind: "sale.del"; id: string }
  | { kind: "job.add"; job: Job }
  | { kind: "job.patch"; id: string; patch: JobPatch }
  | { kind: "job.del"; id: string }
  | { kind: "item.add"; item: ShoppingItem }
  | { kind: "item.patch"; id: string; patch: ItemPatch }
  | { kind: "item.del"; id: string }
  | { kind: "item.clearDone" };
